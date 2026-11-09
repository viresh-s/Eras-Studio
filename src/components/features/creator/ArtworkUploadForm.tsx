'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronDown,
  ArrowRight,
  Check,
  Pencil,
  Eye,
  GripVertical,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createArtwork } from '@/actions/artworkActions';
import type { FreemiumStatus } from '@/lib/freemium/check';
import type { CollectionItem } from '@/actions/collectionActions';
import type { Profile } from '@/types/database';
import {
  MAX_PRICE_INR,
  MAX_PRICE_INR_FORMATTED,
  formatIndianCurrency,
  parseIndianCurrency,
} from '@/lib/constants/currency';
import {
  buildMediumOptions,
  getCustomMediums,
  saveCustomMedium,
} from '@/lib/constants/mediums';
import {
  buildStyleOptions,
  getCustomStyles,
  saveCustomStyle,
} from '@/lib/constants/styles';
import {
  compressImages,
  uploadCompressedPair,
  validateImageFile,
  type PipelineProgress,
  type CompressionResult,
} from '@/lib/media/imagePipeline';

const visibilityOptions = [
  { value: 'Show Price', label: 'Show Price' },
  { value: 'Price on Request', label: 'Price on Request' },
  { value: 'Hide Price', label: 'Hide Price' },
];

const availabilityOptions = [
  { value: 'Available', label: 'Available' },
  { value: 'For Sale', label: 'For Sale' },
  { value: 'Not for sale', label: 'Not for sale' },
  { value: 'Sold', label: 'Sold' },
];

const dimensionUnitOptions = [
  { value: 'Inches (in)', label: 'Inches (in)' },
  { value: 'Centimeters (cm)', label: 'Centimeters (cm)' },
];

const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artistName: z.string().min(1, 'Artist name is required'),
  artType: z.string().min(1, 'Please select a medium'),
  year: z.string().optional(),
  dimensionUnit: z.string().optional(),
  width: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Width must be a positive number' }
    ),
  height: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Height must be a positive number' }
    ),
  location: z.string().optional(),
  style: z.string().optional(),
  collection: z.string().optional(),
  description: z.string().optional(),
  externalLink: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  price: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const num = parseIndianCurrency(val);
        return num !== null && num > 0 && num <= MAX_PRICE_INR;
      },
      {
        message: `Price cannot exceed ${MAX_PRICE_INR_FORMATTED}`,
      }
    ),
  priceVisibility: z.enum(['Show Price', 'Price on Request', 'Hide Price']),
  status: z.enum(['Available', 'For Sale', 'Not for sale', 'Sold']),
});

type UploadForm = z.infer<typeof uploadSchema>;

interface ImageFileMeta {
  name: string;
  sizeFormatted: string;
  width?: number;
  height?: number;
}

interface ArtworkUploadFormProps {
  userId: string;
  profile: Profile | null;
  collections?: CollectionItem[];
  freemiumStatus: FreemiumStatus;
}

export default function ArtworkUploadForm({
  userId,
  profile,
  collections = [],
  freemiumStatus,
}: ArtworkUploadFormProps) {
  const router = useRouter();

  // Multi-step state: 1 = Upload images, 2 = Artwork details
  const [step, setStep] = useState<1 | 2>(1);

  // Images state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [filesMeta, setFilesMeta] = useState<ImageFileMeta[]>([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number>(0);

  // Drag & drop state for dropzone
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Custom Medium & Style state (allowing inline "Other" creation)
  const [customMediums, setCustomMediums] = useState<string[]>([]);
  const [isCustomMedium, setIsCustomMedium] = useState(false);
  const [customMediumInput, setCustomMediumInput] = useState('');

  const [customStyles, setCustomStyles] = useState<string[]>([]);
  const [isCustomStyle, setIsCustomStyle] = useState(false);
  const [customStyleInput, setCustomStyleInput] = useState('');

  // Load custom mediums and styles from local storage on client mount
  useEffect(() => {
    setCustomMediums(getCustomMediums());
    setCustomStyles(getCustomStyles());
  }, []);

  // Form submission state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState<PipelineProgress | null>(null);
  const [uploadStage, setUploadStage] = useState<string | null>(null);

  // Default values based on creator profile - only artist name is pre-filled
  const defaultArtistName = profile?.full_name || '';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: '',
      artistName: defaultArtistName,
      artType: '',
      year: '',
      dimensionUnit: 'Inches (in)',
      width: '',
      height: '',
      location: '',
      style: '',
      collection: '',
      description: '',
      externalLink: '',
      price: '',
      priceVisibility: 'Show Price',
      status: 'Available',
    },
  });

  const watchedTitle = watch('title');
  const watchedArtistName = watch('artistName');
  const watchedArtType = watch('artType');
  const watchedYear = watch('year');
  const watchedWidth = watch('width');
  const watchedHeight = watch('height');
  const watchedDimensionUnit = watch('dimensionUnit');
  const watchedPriceVisibility = watch('priceVisibility');

  // Strip file extension helper (e.g. "artwork.png" -> "artwork")
  const stripFileExtension = (filename?: string | null): string => {
    if (!filename) return '';
    return filename.replace(/\.[^/.]+$/, '');
  };

  const mediumOptions = useMemo(() => {
    return buildMediumOptions(customMediums, watchedArtType);
  }, [customMediums, watchedArtType]);

  const styleOptions = useMemo(() => {
    return buildStyleOptions(customStyles);
  }, [customStyles]);

  const handleCommitCustomMedium = () => {
    const trimmed = customMediumInput.trim();
    if (!trimmed || trimmed.toLowerCase() === 'other') return;

    saveCustomMedium(trimmed);
    setCustomMediums((prev) => {
      if (prev.some((m) => m.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed];
    });
    setValue('artType', trimmed, { shouldValidate: true });
  };

  const handleCancelCustomMedium = () => {
    setIsCustomMedium(false);
    setCustomMediumInput('');
    setValue('artType', '', { shouldValidate: true });
  };

  const handleCommitCustomStyle = () => {
    const trimmed = customStyleInput.trim();
    if (!trimmed || trimmed.toLowerCase() === 'other') return;

    saveCustomStyle(trimmed);
    setCustomStyles((prev) => {
      if (prev.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed];
    });
    setValue('style', trimmed, { shouldValidate: true });
  };

  const handleCancelCustomStyle = () => {
    setIsCustomStyle(false);
    setCustomStyleInput('');
    setValue('style', '', { shouldValidate: true });
  };

  // Format bytes to human readable string
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url?.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  // Read dimensions from an image file
  const readImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };

  // Process incoming files
  const processFiles = async (incomingFiles: File[]) => {
    setError(null);
    if (!incomingFiles || incomingFiles.length === 0) return;

    if (selectedFiles.length >= 5) {
      setError('Maximum 5 images allowed per artwork.');
      return;
    }

    const validFiles: File[] = [];
    for (const file of incomingFiles) {
      try {
        validateImageFile(file);
        validFiles.push(file);
      } catch (valErr) {
        setError(valErr instanceof Error ? valErr.message : 'Invalid image file');
      }
    }

    if (validFiles.length > 0) {
      const remainingSlots = 5 - selectedFiles.length;
      if (validFiles.length > remainingSlots) {
        setError(`Only ${remainingSlots} more image${remainingSlots > 1 ? 's' : ''} can be added (max 5 images allowed).`);
      }
      const filesToAdd = validFiles.slice(0, remainingSlots);
      const newFiles = [...selectedFiles, ...filesToAdd];
      setSelectedFiles(newFiles);

      const newUrls = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls(newUrls);

      // Extract metadata for each file
      const metas: ImageFileMeta[] = await Promise.all(
        newFiles.map(async (f) => {
          const dims = await readImageDimensions(f);
          return {
            name: f.name,
            sizeFormatted: formatFileSize(f.size),
            width: dims.width,
            height: dims.height,
          };
        })
      );
      setFilesMeta(metas);

      if (selectedFiles.length === 0) {
        setSelectedPreviewIndex(0);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    processFiles(rawFiles);
    e.target.value = '';
  };

  // Edit / Replace image at current preview index
  const handleReplaceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
      const newFiles = [...selectedFiles];
      newFiles[selectedPreviewIndex] = file;
      setSelectedFiles(newFiles);

      const newUrl = URL.createObjectURL(file);
      const newUrls = [...previewUrls];
      if (newUrls[selectedPreviewIndex]?.startsWith('blob:')) {
        URL.revokeObjectURL(newUrls[selectedPreviewIndex]);
      }
      newUrls[selectedPreviewIndex] = newUrl;
      setPreviewUrls(newUrls);

      readImageDimensions(file).then((dims) => {
        const newMetas = [...filesMeta];
        newMetas[selectedPreviewIndex] = {
          name: file.name,
          sizeFormatted: formatFileSize(file.size),
          width: dims.width,
          height: dims.height,
        };
        setFilesMeta(newMetas);
      });
    } catch (valErr) {
      setError(valErr instanceof Error ? valErr.message : 'Invalid image file');
    }
    e.target.value = '';
  };

  // Remove a file
  const removeFile = (index: number) => {
    if (previewUrls[index]?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newUrls = [...previewUrls];
    newUrls.splice(index, 1);
    setPreviewUrls(newUrls);

    const newMetas = [...filesMeta];
    newMetas.splice(index, 1);
    setFilesMeta(newMetas);

    if (selectedPreviewIndex >= newFiles.length) {
      setSelectedPreviewIndex(Math.max(0, newFiles.length - 1));
    }
  };

  // Drag reordering for thumbnails
  const handleDragStartThumb = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDropThumb = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === dropIndex) return;

    const newFiles = [...selectedFiles];
    const [movedFile] = newFiles.splice(sourceIndex, 1);
    newFiles.splice(dropIndex, 0, movedFile);
    setSelectedFiles(newFiles);

    const newUrls = [...previewUrls];
    const [movedUrl] = newUrls.splice(sourceIndex, 1);
    newUrls.splice(dropIndex, 0, movedUrl);
    setPreviewUrls(newUrls);

    const newMetas = [...filesMeta];
    const [movedMeta] = newMetas.splice(sourceIndex, 1);
    newMetas.splice(dropIndex, 0, movedMeta);
    setFilesMeta(newMetas);

    setSelectedPreviewIndex(dropIndex);
  };

  // Drag and drop for dropzone
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Tag helper
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Core submission handler (both for draft and publish)
  const submitArtwork = async (data: UploadForm, isPublished: boolean) => {
    if (selectedFiles.length === 0) {
      setError('Please upload at least one image of your artwork.');
      setStep(1);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCompressionProgress(null);
    setUploadStage(null);

    try {
      const supabase = createClient();

      // ── Stage 1: Client-Side WebP Compression ──
      setUploadStage('Compressing images for maximum clarity & performance...');
      let compressionResults: CompressionResult[];
      try {
        compressionResults = await compressImages(selectedFiles, (progress) => {
          setCompressionProgress(progress);
        });
      } catch (compErr) {
        throw new Error(
          `Image compression failed: ${compErr instanceof Error ? compErr.message : 'Unknown error'}`
        );
      }

      // ── Stage 2: Upload Compressed WebP Pairs to Supabase ──
      setUploadStage('Uploading optimized artwork images...');
      const uploadedPairs: { cardUrl: string; fullUrl: string }[] = [];

      for (let i = 0; i < compressionResults.length; i++) {
        setUploadStage(`Uploading image ${i + 1} of ${compressionResults.length}...`);
        const urls = await uploadCompressedPair(supabase, userId, compressionResults[i], i);
        uploadedPairs.push(urls);
      }

      // Cover image = first uploaded image pair
      const coverImage = uploadedPairs[0].cardUrl;
      const coverImageFull = uploadedPairs[0].fullUrl;
      const additionalImages = uploadedPairs.slice(1).map((p) => p.cardUrl);
      const additionalImagesFull = uploadedPairs.slice(1).map((p) => p.fullUrl);
      const coverMeta = compressionResults[0];

      // Format dimensions string
      let formattedDimensions = '';
      if (data.width && data.height) {
        const unit = data.dimensionUnit === 'Centimeters (cm)' ? 'cm' : 'in';
        formattedDimensions = `${data.width} × ${data.height} ${unit}`;
      }

      const numericPrice = data.price ? parseIndianCurrency(data.price) : null;

      // Handle custom medium / style persistence
      let finalMedium = data.artType;
      if (isCustomMedium && customMediumInput.trim()) {
        finalMedium = customMediumInput.trim();
        saveCustomMedium(finalMedium);
      }

      let finalStyle = data.style;
      if (isCustomStyle && customStyleInput.trim()) {
        finalStyle = customStyleInput.trim();
        saveCustomStyle(finalStyle);
      }

      // ── Stage 3: Create Artwork in Database ──
      setUploadStage('Finalizing artwork portfolio entry...');
      await createArtwork({
        userId,
        title: data.title.trim(),
        artType: finalMedium,
        artistName: data.artistName.trim(),
        description: data.description?.trim() || undefined,
        externalLink: data.externalLink?.trim() || undefined,
        imageUrl: coverImage,
        imageUrlFull: coverImageFull,
        additionalImages,
        additionalImagesFull,
        imageWidth: coverMeta.originalWidth,
        imageHeight: coverMeta.originalHeight,
        aspectRatio: coverMeta.aspectRatio,
        price: numericPrice,
        year: data.year?.trim() || undefined,
        dimensions: formattedDimensions || undefined,
        width: data.width?.trim() || undefined,
        height: data.height?.trim() || undefined,
        location: data.location?.trim() || undefined,
        style: finalStyle?.trim() || undefined,
        tags,
        collection: data.collection?.trim() || undefined,
        priceVisibility: data.priceVisibility,
        isPublished,
        status: isPublished ? data.status : 'Not for sale',
      });

      // Redirect back to portfolio on success
      router.push('/portfolio');
      router.refresh();
    } catch (err: any) {
      console.error('Artwork creation failed:', err);
      setError(err?.message || 'Failed to upload artwork. Please try again.');
    } finally {
      setIsLoading(false);
      setUploadStage(null);
      setCompressionProgress(null);
    }
  };

  const onPublishSubmit = (data: UploadForm) => {
    submitArtwork(data, true);
  };

  const onInvalid = (formErrors: any) => {
    const fieldOrder = ['title', 'artistName', 'artType', 'width', 'height', 'price'];
    const firstErrorField = fieldOrder.find((field) => formErrors[field]);
    if (firstErrorField) {
      const el = document.getElementById(`artwork-field-${firstErrorField}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          el.focus();
        }, 150);
      }
    }
  };

  const handleSaveDraft = () => {
    if (selectedFiles.length === 0) {
      setError('Please upload at least one image before saving a draft.');
      return;
    }
    const currentValues = watch();
    const draftTitle =
      currentValues.title?.trim() ||
      stripFileExtension(selectedFiles[0]?.name) ||
      'Untitled Draft';
    submitArtwork({ ...currentValues, title: draftTitle }, false);
  };

  const currentPreviewFile = selectedFiles[selectedPreviewIndex];
  const activeMeta = filesMeta[selectedPreviewIndex] || {
    name: currentPreviewFile?.name || '',
    sizeFormatted: currentPreviewFile ? formatFileSize(currentPreviewFile.size) : '',
    width: undefined,
    height: undefined,
  };

  const currentCoverUrl = previewUrls[0] || null;

  return (
    <div
      className="w-full min-h-screen bg-white text-[#141413] pb-16"
      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
    >
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={editImageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleReplaceImage}
        className="hidden"
      />

      {/* ======================================================== */}
      {/* 1. TOP SUBHEADER WITH BREADCRUMB, TITLE & STEPPER        */}
      {/* ======================================================== */}
      <div className="border-b border-[#E8E8E3] pb-8 pt-2 mb-8 sm:mb-10">
        {/* Breadcrumb: Back to portfolio */}
        <div className="mb-6">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2.5 text-xs sm:text-sm text-[#6E6E69] hover:text-[#141413] transition-colors font-normal select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E8E8E3] flex items-center justify-center text-[#6E6E69] hover:border-black shadow-2xs">
              <ChevronLeft size={16} />
            </div>
            <span>Back to portfolio</span>
          </Link>
        </div>

        {/* Title + Stepper Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1
              className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#141413] tracking-tight leading-tight"
              style={{
                fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                fontStyle: 'italic',
              }}
            >
              {step === 1 ? 'Upload your artwork' : 'Artwork details'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6E69] font-normal mt-2">
              {step === 1
                ? 'Give your work the space it deserves. Start with your images.'
                : 'Tell the story of your work, then make it part of ERAS.'}
            </p>
          </div>

          {/* Stepper Component */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 select-none">
            {/* Step 1 Indicator */}
            <div
              className={`flex items-center gap-2.5 cursor-pointer ${
                step === 1 ? 'opacity-100' : 'opacity-85 hover:opacity-100'
              }`}
              onClick={() => setStep(1)}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all ${
                  step === 1
                    ? 'bg-[#1345EE] text-white shadow-2xs'
                    : 'bg-[#EEF2FE] text-[#1345EE]'
                }`}
              >
                {step > 1 ? <Check size={14} strokeWidth={2.5} /> : '1'}
              </div>
              <span
                className={`text-xs sm:text-sm font-medium transition-colors ${
                  step === 1 ? 'text-[#141413]' : 'text-[#6E6E69]'
                }`}
              >
                Upload artwork
              </span>
            </div>

            {/* Connecting Line */}
            <div className="w-6 sm:w-10 h-[1.5px] bg-[#E8E8E3]" />

            {/* Step 2 Indicator */}
            <div
              className={`flex items-center gap-2.5 ${
                selectedFiles.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              }`}
              onClick={() => selectedFiles.length > 0 && setStep(2)}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all ${
                  step === 2
                    ? 'bg-[#1345EE] text-white shadow-2xs'
                    : 'bg-[#F7F7F5] text-[#6E6E69] border border-[#E8E8E3]'
                }`}
              >
                2
              </div>
              <span
                className={`text-xs sm:text-sm font-medium transition-colors ${
                  step === 2 ? 'text-[#141413]' : 'text-[#6E6E69]'
                }`}
              >
                Artwork details
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-md">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload/Compression Status Notification */}
      {isLoading && uploadStage && (
        <div className="mb-6 p-4 rounded-2xl bg-[#EEF2FE] border border-[#CED8FC] text-xs sm:text-sm text-[#1345EE] flex items-center gap-3">
          <Loader2 size={18} className="animate-spin text-[#1345EE] shrink-0" />
          <div className="flex-1">
            <p className="font-medium">{uploadStage}</p>
            {compressionProgress && (
              <p className="text-[11px] text-[#458CFF] mt-0.5 capitalize">
                {compressionProgress.stage.replace('-', ' ')} ({compressionProgress.fileIndex + 1}/
                {compressionProgress.totalFiles}) — {compressionProgress.percent}%
              </p>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
            e.preventDefault();
          }
        }}
      >
        {/* ======================================================== */}
        {/* STEP 1: UPLOAD ARTWORK IMAGES VIEW                       */}
        {/* ======================================================== */}
        {step === 1 && (
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
            {/* Left Column: Big Image Display, Thumbnails & Dropzone */}
            <div className="flex-1 w-full flex flex-col gap-6">
              {/* Image Counter Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base font-medium text-[#141413]">
                  Artwork images <span className="text-red-500">*</span>
                </span>
                <span className="text-xs sm:text-sm text-[#6E6E69]">
                  {selectedFiles.length} of 5 images uploaded
                </span>
              </div>

              {/* Main Card with Preview Image & Details */}
              {selectedFiles.length > 0 ? (
                <div className="w-full border border-[#E8E8E3] rounded-3xl overflow-hidden bg-white shadow-2xs">
                  {/* Large Image Box */}
                  <div className="w-full h-[320px] sm:h-[440px] md:h-[500px] bg-[#F7F7F5] flex items-center justify-center p-4 relative overflow-hidden select-none">
                    <img
                      src={previewUrls[selectedPreviewIndex]}
                      alt="Artwork Preview"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-xs pointer-events-none"
                    />
                  </div>

                  {/* Bottom Bar: Cover badge, Filename, Resolution, Edit & Delete */}
                  <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#E8E8E3] bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedPreviewIndex === 0 ? (
                        <div className="px-2.5 py-1 rounded-md bg-[#EEF2FE] border border-[#CED8FC] text-[#1345EE] text-[11px] font-medium shrink-0">
                          Cover
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded-md bg-[#F7F7F5] border border-[#E8E8E3] text-[#6E6E69] text-[11px] font-medium shrink-0">
                          Detail view
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-[#141413] truncate">
                          {activeMeta.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-[#6E6E69] truncate">
                          {activeMeta.width && activeMeta.height
                            ? `${activeMeta.width} × ${activeMeta.height} px · ${activeMeta.sizeFormatted}`
                            : activeMeta.sizeFormatted}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Edit Image Button */}
                      <button
                        type="button"
                        onClick={() => editImageInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl border border-[#E8E8E3] bg-white text-xs font-medium text-[#6E6E69] hover:text-[#141413] hover:border-black transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Pencil size={13} className="text-[#6E6E69]" />
                        <span>Edit image</span>
                      </button>

                      <div className="w-[1px] h-6 bg-[#E8E8E3]" />

                      {/* Delete Image Button */}
                      <button
                        type="button"
                        onClick={() => removeFile(selectedPreviewIndex)}
                        className="w-9 h-9 rounded-xl border border-[#E8E8E3] bg-white flex items-center justify-center text-[#6E6E69] hover:text-red-600 hover:border-red-200 transition-colors shadow-2xs cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Big Initial Dropzone Area when no images uploaded yet */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full h-[360px] sm:h-[420px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#1345EE] bg-blue-50/40 scale-[0.99]'
                      : 'border-[#E8E8E3] bg-[#F7F7F5] hover:bg-gray-100 hover:border-gray-400'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-white border border-[#E8E8E3] flex items-center justify-center text-[#1345EE] mb-4 shadow-xs">
                    <Upload size={26} />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-[#141413] text-center">
                    Drop images here or browse files
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6E6E69] text-center mt-1.5 max-w-sm">
                    Up to 5 images · maximum 50 MB each (JPEG, PNG, WebP)
                  </p>
                  <button
                    type="button"
                    className="mt-6 px-6 py-2.5 rounded-full bg-white border border-[#E8E8E3] text-xs font-medium text-[#141413] hover:border-black transition-colors shadow-2xs"
                  >
                    Choose files
                  </button>
                </div>
              )}

              {/* Thumbnails Strip & Dropzone Tile Row */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  {selectedFiles.map((file, idx) => {
                    const isCover = idx === 0;
                    const isSelected = idx === selectedPreviewIndex;

                    return (
                      <div
                        key={idx}
                        draggable
                        onDragStart={(e) => handleDragStartThumb(e, idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropThumb(e, idx)}
                        onClick={() => setSelectedPreviewIndex(idx)}
                        className="flex flex-col gap-1.5 cursor-pointer group"
                      >
                        {/* Thumbnail Box */}
                        <div
                          className={`w-28 h-20 sm:w-36 sm:h-24 rounded-2xl overflow-hidden p-1.5 transition-all select-none ${
                            isSelected
                              ? 'border-2 border-[#1345EE] shadow-sm'
                              : isCover
                              ? 'border-2 border-[#1345EE]'
                              : 'border border-[#E8E8E3] hover:border-gray-400'
                          }`}
                        >
                          <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100 relative">
                            <img
                              src={previewUrls[idx]}
                              alt={`Thumb ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {isCover && (
                              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1345EE] text-white shadow-2xs">
                                1
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Label & Actions */}
                        <div className="flex items-center justify-between px-1">
                          <span
                            className={`text-[11px] font-normal truncate ${
                              isCover ? 'text-[#1345EE] font-medium' : 'text-[#6E6E69]'
                            }`}
                          >
                            {isCover ? 'Cover image' : 'Detail view'}
                          </span>
                          <span title="Drag to reorder">
                            <GripVertical
                              size={12}
                              className="text-[#6E6E69] opacity-40 group-hover:opacity-100 transition-opacity"
                            />
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add more images tile (if fewer than 5) */}
                  {selectedFiles.length < 5 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className="w-44 sm:w-56 h-20 sm:h-24 rounded-2xl border border-dashed border-[#E8E8E3] bg-[#F7F7F5] hover:bg-gray-100 hover:border-gray-400 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors p-2 text-center"
                    >
                      <Upload size={16} className="text-[#6E6E69]" />
                      <span className="text-[11px] sm:text-xs font-medium text-[#141413]">
                        Drop images or browse
                      </span>
                      <span className="text-[10px] text-[#6E6E69]">
                        Up to 5 · max 50 MB
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Help Reorder Note */}
              {selectedFiles.length > 0 && (
                <p className="text-xs text-[#6E6E69] flex items-center gap-1.5 pt-1">
                  <GripVertical size={13} className="text-[#6E6E69]" />
                  <span>Drag to reorder. The first image is always your cover.</span>
                </p>
              )}
            </div>

            {/* Right Column: Cover Preview Card & Guidelines */}
            <div className="w-full lg:w-[380px] xl:w-[410px] flex flex-col gap-6 shrink-0">
              {/* Cover Preview Card */}
              <div className="w-full bg-white border border-[#E8E8E3] rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-[#141413]">
                    Cover preview
                  </span>
                  <Eye size={16} className="text-[#6E6E69]" />
                </div>

                {/* Preview Image */}
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#F7F7F5] border border-[#E8E8E3] flex items-center justify-center">
                  {currentCoverUrl ? (
                    <img
                      src={currentCoverUrl}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-[#6E6E69]">
                      <ImageIcon size={32} className="opacity-40" />
                      <span className="text-xs font-normal">Cover image appears here</span>
                    </div>
                  )}
                </div>

                {/* Artwork Title & Artist Info */}
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm sm:text-base font-medium text-[#141413] truncate">
                    {stripFileExtension(selectedFiles[0]?.name) || 'Cover image'}
                  </h4>
                  <p className="text-xs text-[#6E6E69] truncate">
                    {defaultArtistName || 'Artist'}
                  </p>
                </div>

                <p className="text-[11px] sm:text-xs text-[#6E6E69] leading-relaxed pt-1 border-t border-[#E8E8E3]">
                  Your first image introduces this work in your portfolio and across ERAS.
                </p>
              </div>

              {/* "Let the artwork lead" Guidelines Card */}
              <div className="w-full bg-white border border-[#E8E8E3] rounded-3xl p-5 sm:p-6 flex flex-col gap-3.5 shadow-2xs">
                <h4 className="text-xs sm:text-sm font-medium text-[#141413]">
                  Let the artwork lead
                </h4>
                <div className="flex flex-col gap-2.5 text-xs text-[#6E6E69] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-[#94948E] select-none">—</span>
                    <span>Use a clear, well-lit image of the full artwork for your cover.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#94948E] select-none">—</span>
                    <span>Add close-ups to show texture, colour and the finer details.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#94948E] select-none">—</span>
                    <span>Keep colours true to the original. Avoid glare and distractions.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: ARTWORK DETAILS FORM VIEW                        */}
        {/* ======================================================== */}
        {step === 2 && (
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-14">
            {/* Left Column: Your Artwork Summary Card & Portfolio Info */}
            <div className="w-full lg:w-[380px] xl:w-[410px] flex flex-col gap-6 shrink-0 order-2 lg:order-1">
              {/* Summary Card */}
              <div className="w-full bg-white border border-[#E8E8E3] rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-[#141413]">
                    Your artwork
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#F3F3EF] border border-[#E5E5DF] text-[11px] font-medium text-[#6E6E69]">
                    Draft
                  </span>
                </div>

                {/* Cover Image */}
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#F7F7F5] border border-[#E8E8E3]">
                  {currentCoverUrl ? (
                    <img
                      src={currentCoverUrl}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#6E6E69]">
                      <ImageIcon size={32} />
                    </div>
                  )}
                </div>

                {/* Live Info */}
                <div className="flex flex-col gap-1.5">
                  <h3
                    className="text-lg sm:text-xl font-bold text-[#141413] tracking-tight leading-snug"
                    style={{
                      fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                      fontStyle: 'italic',
                    }}
                  >
                    {watchedTitle?.trim() || stripFileExtension(selectedFiles[0]?.name) || 'Untitled'}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#6E6E69]">
                    {watchedArtistName?.trim() || defaultArtistName || 'Artist'}
                  </p>
                  <p className="text-xs text-[#6E6E69]">
                    {watchedArtType ? watchedArtType : 'Medium not selected'}
                    {watchedYear?.trim() ? ` · ${watchedYear.trim()}` : ''}
                    {watchedWidth && watchedHeight && (
                      <>
                        <br />
                        {watchedWidth} × {watchedHeight}{' '}
                        {watchedDimensionUnit === 'Centimeters (cm)' ? 'cm' : 'in'}
                      </>
                    )}
                  </p>
                </div>

                <div className="h-[1px] bg-[#E8E8E3] w-full" />

                {/* Thumbnail Preview Strip */}
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {previewUrls.slice(0, 3).map((url, i) => (
                    <div
                      key={i}
                      className={`w-14 h-11 rounded-lg overflow-hidden border ${
                        i === 0 ? 'border-[#1345EE] ring-1 ring-[#1345EE]' : 'border-[#E8E8E3]'
                      }`}
                    >
                      <img src={url} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <span className="text-xs text-[#6E6E69] ml-1">
                    {selectedFiles.length} {selectedFiles.length === 1 ? 'image' : 'images'}
                  </span>
                </div>

                {/* Edit Images Button */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-1 px-4 py-2 rounded-xl border border-[#E8E8E3] bg-white text-xs font-medium text-[#141413] hover:border-black transition-colors flex items-center gap-2 w-fit shadow-2xs cursor-pointer"
                >
                  <Pencil size={13} className="text-[#6E6E69]" />
                  <span>Edit images</span>
                </button>
              </div>

              {/* "A place in your portfolio" Card */}
              <div className="w-full bg-[#F7F7F5] border border-[#E8E8E3] rounded-2xl p-5 flex flex-col gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#E8E8E3] flex items-center justify-center text-[#6E6E69]">
                  <Eye size={16} />
                </div>
                <h4 className="text-xs sm:text-sm font-medium text-[#141413]">
                  A place in your portfolio
                </h4>
                <p className="text-xs text-[#6E6E69] leading-relaxed">
                  Publishing makes this artwork visible on ERAS and in your portfolio. You can edit its details at any time.
                </p>
              </div>

              <p className="text-xs text-[#6E6E69] px-1">
                Not quite ready? Save a draft and return whenever inspiration strikes.
              </p>
            </div>

            {/* Right Column: Form Sections 01, 02, 03 */}
            <div className="flex-1 w-full flex flex-col gap-8 order-1 lg:order-2">
              {/* ====================================================== */}
              {/* SECTION 01: THE ESSENTIALS                             */}
              {/* ====================================================== */}
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <span
                      className="text-2xl sm:text-3xl font-normal text-[#94948E]"
                      style={{
                        fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                        fontStyle: 'italic',
                      }}
                    >
                      01
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-medium text-[#141413]">
                        The essentials
                      </h3>
                      <p className="text-xs sm:text-[13px] text-[#6E6E69] mt-0.5">
                        The name, material and scale of your work.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#6E6E69] shrink-0">* Required fields</span>
                </div>

                {/* Form Fields: Row 1 (Title, Artist Name) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                      Title *
                    </label>
                    <input
                      id="artwork-field-title"
                      type="text"
                      {...register('title')}
                      placeholder="e.g. The Broken Illusion"
                      className={`w-full px-4 py-3 rounded-2xl bg-white text-xs sm:text-sm text-[#141413] placeholder:text-[#6E6E69] focus:outline-none transition-all font-normal shadow-2xs ${
                        errors.title
                          ? 'border-2 border-red-500 ring-2 ring-red-500/20'
                          : 'border border-[#E8E8E3] focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE]'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                      Artist Name *
                    </label>
                    <input
                      id="artwork-field-artistName"
                      type="text"
                      {...register('artistName')}
                      placeholder="e.g. Rishi Mailoorkar"
                      className={`w-full px-4 py-3 rounded-2xl bg-white text-xs sm:text-sm text-[#141413] placeholder:text-[#6E6E69] focus:outline-none transition-all font-normal shadow-2xs ${
                        errors.artistName
                          ? 'border-2 border-red-500 ring-2 ring-red-500/20'
                          : 'border border-[#E8E8E3] focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE]'
                      }`}
                    />
                  </div>
                </div>

                {/* Form Fields: Row 2 (Medium, Year) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                      Medium *
                    </label>
                    <div className="relative">
                      {!isCustomMedium ? (
                        <>
                          <select
                            id="artwork-field-artType"
                            {...register('artType')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'Other') {
                                setIsCustomMedium(true);
                                setCustomMediumInput('');
                                setValue('artType', '', { shouldValidate: true });
                              } else {
                                register('artType').onChange(e);
                              }
                            }}
                            className={`w-full appearance-none px-4 py-3 rounded-2xl bg-white text-xs sm:text-sm text-[#141413] focus:outline-none transition-all font-normal cursor-pointer shadow-2xs pr-10 ${
                              errors.artType
                                ? 'border-2 border-red-500 ring-2 ring-red-500/20'
                                : 'border border-[#E8E8E3] focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE]'
                            }`}
                          >
                            <option value="">Select medium</option>
                            {mediumOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={16}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6E6E69] pointer-events-none"
                          />
                        </>
                      ) : (
                        <div className="relative flex items-center">
                          <input
                            id="artwork-field-artType"
                            type="text"
                            autoFocus
                            placeholder="Type custom medium..."
                            value={customMediumInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomMediumInput(val);
                              setValue('artType', val, { shouldValidate: true });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCommitCustomMedium();
                              } else if (e.key === 'Escape') {
                                handleCancelCustomMedium();
                              }
                            }}
                            onBlur={handleCommitCustomMedium}
                            className={`w-full px-4 py-3 rounded-2xl bg-white text-xs sm:text-sm text-[#141413] placeholder:text-[#6E6E69] focus:outline-none transition-all font-normal shadow-2xs pr-16 ${
                              errors.artType
                                ? 'border-2 border-red-500 ring-2 ring-red-500/20'
                                : 'border border-[#1345EE] focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE]'
                            }`}
                          />
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {customMediumInput.trim() && (
                              <button
                                type="button"
                                onClick={handleCommitCustomMedium}
                                className="px-2 py-0.5 rounded-md bg-[#1345EE] text-white text-[10px] font-medium hover:bg-blue-700 transition-colors cursor-pointer select-none"
                                title="Save to list"
                              >
                                Save
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={handleCancelCustomMedium}
                              className="p-1 rounded-md text-[#6E6E69] hover:text-[#141413] hover:bg-gray-100 transition-colors cursor-pointer select-none"
                              title="Back to dropdown"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                      Year
                    </label>
                    <input
                      type="text"
                      {...register('year')}
                      placeholder="e.g. 2026"
                      className="w-full px-4 py-3 rounded-2xl border border-[#E8E8E3] bg-white text-xs sm:text-sm text-[#141413] placeholder:text-[#6E6E69] focus:outline-none focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE] transition-all font-normal shadow-2xs"
                    />
                  </div>
                </div>

                {/* Form Fields: Row 3 (Dimension Unit, Width, Height) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                      Dimension Unit
                    </label>
                    <div className="relative">
                      <select
                        {...register('dimensionUnit')}
                        className="w-full appearance-none px-4 py-3 rounded-2xl border border-[#E8E8E3] bg-white text-xs sm:text-sm text-[#141413] focus:outline-none focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE] transition-all font-normal cursor-pointer shadow-2xs pr-10"
                      >
                        {dimensionUnitOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6E6E69] pointer-events-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                      Dimensions · Width (in)
                    </label>
                    <input
                      id="artwork-field-width"
                      type="number"
                      step="any"
                      {...register('width')}
                      placeholder="e.g. 24"
                      className={`w-full px-4 py-3 rounded-2xl bg-white text-xs sm:text-sm text-[#141413] placeholder:text-[#6E6E69] focus:outline-none transition-all font-normal shadow-2xs ${
                        errors.width
                          ? 'border-2 border-red-500 ring-2 ring-red-500/20'
                          : 'border border-[#E8E8E3] focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE]'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                      Dimensions · Height (in)
                    </label>
                    <input
                      id="artwork-field-height"
                      type="number"
                      step="any"
                      {...register('height')}
                      placeholder="e.g. 18"
                      className={`w-full px-4 py-3 rounded-2xl bg-white text-xs sm:text-sm text-[#141413] placeholder:text-[#6E6E69] focus:outline-none transition-all font-normal shadow-2xs ${
                        errors.height
                          ? 'border-2 border-red-500 ring-2 ring-red-500/20'
                          : 'border border-[#E8E8E3] focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE]'
                      }`}
                    />
                  </div>
                </div>

                {/* Form Fields: Row 4 (Location) */}
                <div>
                  <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    {...register('location')}
                    placeholder="e.g. Mumbai, India"
                    className="w-full px-4 py-3 rounded-2xl border border-[#E8E8E3] bg-white text-xs sm:text-sm text-[#141413] placeholder:text-[#6E6E69] focus:outline-none focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE] transition-all font-normal shadow-2xs"
                  />
                </div>
              </div>

              <div className="h-[1px] bg-[#E8E8E3] w-full" />

              {/* ====================================================== */}
              {/* SECTION 02: STORY & DISCOVERY                          */}
              {/* ====================================================== */}
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <span
                    className="text-2xl sm:text-3xl font-normal text-[#94948E]"
                    style={{
                      fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                      fontStyle: 'italic',
                    }}
                  >
                    02
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-[#141413]">
                      Story & discovery
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#6E6E69] mt-0.5">
                      Help collectors understand and find your artwork.
                    </p>
                  </div>
                </div>

                {/* Form Fields: Row 1 (Style, Collection) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                      Style
                    </label>
                    <div className="relative">
                      {!isCustomStyle ? (
                        <>
                          <select
                            {...register('style')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'Other') {
                                setIsCustomStyle(true);
                                setCustomStyleInput('');
                                setValue('style', '', { shouldValidate: true });
                              } else {
                                register('style').onChange(e);
                              }
                            }}
                            className="w-full appearance-none px-4 py-3 rounded-2xl border border-[#E8E8E3] bg-white text-xs sm:text-sm text-[#141413] focus:outline-none focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE] transition-all font-normal cursor-pointer shadow-2xs pr-10"
                          >
                            <option value="">Select style</option>
                            {styleOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={16}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6E6E69] pointer-events-none"
                          />
                        </>
                      ) : (
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Type custom style..."
                            value={customStyleInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomStyleInput(val);
                              setValue('style', val, { shouldValidate: true });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCommitCustomStyle();
                              } else if (e.key === 'Escape') {
                                handleCancelCustomStyle();
                              }
                            }}
                            onBlur={handleCommitCustomStyle}
                            className="w-full px-4 py-3 rounded-2xl border border-[#1345EE] bg-white text-xs sm:text-sm text-[#141413] placeholder:text-[#6E6E69] focus:outline-none focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE] transition-all font-normal shadow-2xs pr-16"
                          />
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {customStyleInput.trim() && (
                              <button
                                type="button"
                                onClick={handleCommitCustomStyle}
                                className="px-2 py-0.5 rounded-md bg-[#1345EE] text-white text-[10px] font-medium hover:bg-blue-700 transition-colors cursor-pointer select-none"
                                title="Save to list"
                              >
                                Save
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={handleCancelCustomStyle}
                              className="p-1 rounded-md text-[#6E6E69] hover:text-[#141413] hover:bg-gray-100 transition-colors cursor-pointer select-none"
                              title="Back to dropdown"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                      Collection
                    </label>
                    <div className="relative">
                      <select
                        {...register('collection')}
                        className="w-full appearance-none px-4 py-3 rounded-2xl border border-[#E8E8E3] bg-white text-xs sm:text-sm text-[#141413] focus:outline-none focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE] transition-all font-normal cursor-pointer shadow-2xs pr-10"
                      >
                        <option value="">None (Individual artwork)</option>
                        {collections.map((col) => (
                          <option key={col.id} value={col.title}>
                            {col.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6E6E69] pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Fields: Row 2 (Tags) */}
                <div>
                  <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                    Tags
                  </label>
                  <div className="w-full min-h-[52px] p-2.5 rounded-2xl border border-[#E8E8E3] bg-white flex flex-wrap items-center gap-2 shadow-2xs">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F3F3EF] border border-[#E5E5DF] text-xs font-medium text-[#6E6E69]"
                      >
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-black cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {isAddingTag ? (
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            } else if (e.key === 'Escape') {
                              setIsAddingTag(false);
                            }
                          }}
                          placeholder="Type tag & Enter"
                          className="text-xs px-2 py-1 rounded border border-[#1345EE] outline-none text-[#141413]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="text-xs text-[#1345EE] font-medium"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingTag(true)}
                        className="text-xs text-[#6E6E69] hover:text-black transition-colors px-2 py-1 cursor-pointer"
                      >
                        + Add tag
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6E6E69] mt-1.5">
                    Choose keywords that describe the subject, mood or technique.
                  </p>
                </div>

                {/* Form Fields: Row 3 (Related Link) */}
                <div>
                  <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                    Related Link
                  </label>
                  <input
                    type="url"
                    {...register('externalLink')}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-2xl border border-[#E8E8E3] bg-white text-xs sm:text-sm text-[#141413] placeholder:text-[#6E6E69] focus:outline-none focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE] transition-all font-normal shadow-2xs"
                  />
                </div>

                {/* Form Fields: Row 4 (Description) */}
                <div>
                  <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    {...register('description')}
                    placeholder="Share the inspiration, process or story behind this piece."
                    className="w-full px-4 py-3 rounded-2xl border border-[#E8E8E3] bg-white text-xs sm:text-sm text-[#141413] placeholder:text-[#6E6E69] focus:outline-none focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE] transition-all font-normal shadow-2xs resize-none"
                  />
                  <p className="text-[11px] text-[#6E6E69] mt-1">
                    Share the inspiration, process or story behind this piece.
                  </p>
                </div>
              </div>

              <div className="h-[1px] bg-[#E8E8E3] w-full" />

              {/* ====================================================== */}
              {/* SECTION 03: AVAILABILITY & PRICING                     */}
              {/* ====================================================== */}
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <span
                    className="text-2xl sm:text-3xl font-normal text-[#94948E]"
                    style={{
                      fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                      fontStyle: 'italic',
                    }}
                  >
                    03
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-[#141413]">
                      Availability & pricing
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#6E6E69] mt-0.5">
                      Choose how your work is presented to collectors.
                    </p>
                  </div>
                </div>

                {/* Form Fields: Row 1 (Availability, Price Visibility) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                      Availability
                    </label>
                    <div className="relative">
                      <select
                        {...register('status')}
                        className="w-full appearance-none px-4 py-3 rounded-2xl border border-[#E8E8E3] bg-white text-xs sm:text-sm text-[#141413] focus:outline-none focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE] transition-all font-normal cursor-pointer shadow-2xs pr-10"
                      >
                        {availabilityOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6E6E69] pointer-events-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                      Price Visibility
                    </label>
                    <div className="relative">
                      <select
                        {...register('priceVisibility')}
                        className="w-full appearance-none px-4 py-3 rounded-2xl border border-[#E8E8E3] bg-white text-xs sm:text-sm text-[#141413] focus:outline-none focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE] transition-all font-normal cursor-pointer shadow-2xs pr-10"
                      >
                        {visibilityOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6E6E69] pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Fields: Row 2 (Price) */}
                <div>
                  <label className="block text-xs font-normal text-[#6E6E69] mb-1.5">
                    Price
                  </label>
                  <input
                    id="artwork-field-price"
                    type="text"
                    {...register('price')}
                    placeholder="e.g. 45,000"
                    className={`w-full px-4 py-3 rounded-2xl bg-white text-xs sm:text-sm text-[#141413] placeholder:text-[#6E6E69] focus:outline-none transition-all font-normal shadow-2xs ${
                      errors.price
                        ? 'border-2 border-red-500 ring-2 ring-red-500/20'
                        : 'border border-[#E8E8E3] focus:border-[#1345EE] focus:ring-1 focus:ring-[#1345EE]'
                    }`}
                  />
                  <p className="text-[11px] text-[#6E6E69] mt-1.5">
                    Max amount: 1,00,00,000
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* BOTTOM ACTION BAR                                        */}
        {/* ======================================================== */}
        <div className="mt-12 pt-6 border-t border-[#E8E8E3] flex flex-col sm:flex-row items-center justify-between gap-4">
          {step === 1 ? (
            <>
              {/* Cancel Button */}
              <Link
                href="/portfolio"
                className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium text-[#141413] hover:bg-gray-100 transition-colors cursor-pointer select-none"
              >
                Cancel
              </Link>

              {/* Step 1 Actions */}
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-xs sm:text-sm text-[#6E6E69] hidden md:inline">
                  {selectedFiles.length === 5 ? 'All images uploaded' : `${selectedFiles.length} of 5 images uploaded`}
                </span>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isLoading || selectedFiles.length === 0}
                  className="px-6 py-2.5 rounded-full border border-[#E8E8E3] bg-white text-xs sm:text-sm font-medium text-[#141413] hover:border-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer select-none"
                >
                  Save draft
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedFiles.length === 0) {
                      setError('Please select at least one image before continuing.');
                      return;
                    }
                    setStep(2);
                  }}
                  disabled={selectedFiles.length === 0}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-[#1345EE] text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer select-none"
                >
                  <span>Continue to details</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Back to Images Button */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium text-[#141413] hover:bg-gray-100 transition-colors cursor-pointer select-none flex items-center gap-1.5"
              >
                <ChevronLeft size={16} />
                <span>Back to images</span>
              </button>

              {/* Step 2 Actions */}
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-xs sm:text-sm text-[#6E6E69] hidden md:inline">
                  Ready to share your perspective?
                </span>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-full border border-[#E8E8E3] bg-white text-xs sm:text-sm font-medium text-[#141413] hover:border-black transition-colors disabled:opacity-40 shadow-2xs cursor-pointer select-none"
                >
                  Save draft
                </button>

                <button
                  type="button"
                  onClick={handleSubmit(onPublishSubmit, onInvalid)}
                  disabled={isLoading}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-[#1345EE] text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer select-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <span>Publish artwork</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

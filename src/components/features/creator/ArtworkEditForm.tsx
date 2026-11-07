'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Save, Link as LinkIcon, ArrowLeft, Upload, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { updateArtwork } from '@/actions/artworkActions';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import MultiSelect from '@/components/ui/MultiSelect';
import TextArea from '@/components/ui/TextArea';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { buildMediumOptions, getCustomMediums, saveCustomMedium } from '@/lib/constants/mediums';
import { buildCollectionOptions, getCustomCollections, saveCustomCollection } from '@/lib/constants/collections';
import { getCreatorCollections, createCollection } from '@/actions/collectionActions';
import {
  MAX_PRICE_INR,
  MAX_PRICE_INR_FORMATTED,
  formatIndianCurrency,
  parseIndianCurrency,
} from '@/lib/constants/currency';
import { DIMENSION_UNIT_OPTIONS, parseDimensionsString } from '@/lib/constants/dimensions';
import {
  compressImages,
  uploadCompressedPair,
  validateImageFile,
  MAX_INPUT_SIZE_MB,
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

const styleOptions = [
  { value: 'Abstract', label: 'Abstract' },
  { value: 'Minimalist', label: 'Minimalist' },
  { value: 'Contemporary', label: 'Contemporary' },
  { value: 'Modern', label: 'Modern' },
  { value: 'Impressionism', label: 'Impressionism' },
  { value: 'Pop Art', label: 'Pop Art' },
  { value: 'Surrealism', label: 'Surrealism' },
  { value: 'Realism', label: 'Realism' },
  { value: 'Expressionism', label: 'Expressionism' },
  { value: 'Cubism', label: 'Cubism' },
  { value: 'Other', label: 'Other' },
];



const tagsOptions = [
  { value: 'oil, canvas', label: 'Oil on Canvas' },
  { value: 'acrylic, canvas', label: 'Acrylic on Canvas' },
  { value: 'watercolor, paper', label: 'Watercolor on Paper' },
  { value: 'digital', label: 'Digital' },
  { value: 'mixed media', label: 'Mixed Media' },
  { value: 'photography', label: 'Photography' },
  { value: 'sculpture', label: 'Sculpture' },
];

const editSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  artType: z.string().min(1, 'Please select a medium'),
  artistName: z.string().min(2, 'Artist name is required'),
  year: z.string().optional(),
  dimensions: z.string().optional(),
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
  tags: z.array(z.string()).optional(),
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
        message: `Price must be positive and cannot exceed ${MAX_PRICE_INR_FORMATTED}`,
      }
    ),
  priceVisibility: z.enum(['Show Price', 'Price on Request', 'Hide Price']),
  status: z.enum(['Available', 'For Sale', 'Not for sale', 'Sold']),
}).refine(
  (data) => {
    if ((data.width || data.height) && !data.dimensionUnit) {
      return false;
    }
    return true;
  },
  {
    message: 'Please select a dimension unit first',
    path: ['dimensionUnit'],
  }
).refine(
  (data) => {
    if (data.dimensionUnit && ((data.width && !data.height) || (!data.width && data.height))) {
      return false;
    }
    return true;
  },
  {
    message: 'Please enter both width and height',
    path: ['height'],
  }
);

type EditForm = z.infer<typeof editSchema>;

interface ArtworkEditFormProps {
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  artwork: any;
}

export default function ArtworkEditForm({ userId, artwork }: ArtworkEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitAction, setSubmitAction] = useState<'publish' | 'draft'>('publish');
  const [error, setError] = useState<string | null>(null);

  // Initial images from the database
  const initialImages = [artwork.image_url, ...(artwork.additional_images || [])].filter(Boolean);
  const initialFullImages = [
    artwork.image_url_full || artwork.image_url,
    ...(artwork.additional_images_full || artwork.additional_images || []),
  ].filter(Boolean);

  const [existingUrls, setExistingUrls] = useState<string[]>(initialImages);
  const [existingFullUrls, setExistingFullUrls] = useState<string[]>(initialFullImages);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [customMediums, setCustomMediums] = useState<string[]>([]);
  const [customMediumInput, setCustomMediumInput] = useState('');
  const [customCollections, setCustomCollections] = useState<string[]>([]);
  const [customStyle, setCustomStyle] = useState('');
  const [customCollection, setCustomCollection] = useState('');

  // Load custom mediums and collections from localStorage & Supabase on mount
  useEffect(() => {
    setCustomMediums(getCustomMediums());
    const localCols = getCustomCollections();
    setCustomCollections(localCols);
    getCreatorCollections(userId).then((items) => {
      const titles = items.map((i) => i.title);
      setCustomCollections((prev) => Array.from(new Set([...prev, ...titles])));
    }).catch(() => {});
  }, [userId]);

  const mediumOptions = useMemo(
    () => buildMediumOptions(customMediums, artwork.art_type),
    [customMediums, artwork.art_type]
  );

  const collectionOptions = useMemo(
    () => buildCollectionOptions(customCollections, artwork.collection),
    [customCollections, artwork.collection]
  );

  // Drag and drop state
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Compression pipeline state
  const [compressionProgress, setCompressionProgress] = useState<PipelineProgress | null>(null);
  const [uploadStage, setUploadStage] = useState<string | null>(null);

  const totalImages = existingUrls.length + newFiles.length;

  const parsedDim = parseDimensionsString(artwork.dimensions);
  const initialWidth = artwork.width || parsedDim.width || '';
  const initialHeight = artwork.height || parsedDim.height || '';
  const initialUnit = parsedDim.unit || '';

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: artwork.title || '',
      artType: artwork.art_type || '',
      artistName: artwork.artist_name || '',
      year: artwork.year || '',
      dimensions: artwork.dimensions || '',
      dimensionUnit: initialUnit,
      width: initialWidth,
      height: initialHeight,
      location: artwork.location || '',
      style: artwork.style || '',
      collection: artwork.collection || '',
      tags: artwork.tags || [],
      description: artwork.description || '',
      externalLink: artwork.external_link || '',
      price: artwork.price ? formatIndianCurrency(artwork.price) : '',
      priceVisibility: artwork.price_visibility || 'Show Price',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: (artwork.status as any) || 'Available',
    }
  });

  const selectedMedium = watch('artType');
  const selectedDimensionUnit = watch('dimensionUnit');
  const selectedStyle = watch('style');
  const selectedCollection = watch('collection');
  const selectedPriceVisibility = watch('priceVisibility');

  const processFiles = (incomingFiles: File[]) => {
    setError(null);
    if (!incomingFiles || incomingFiles.length === 0) return;

    if (totalImages >= 5) {
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
      const availableSlots = 5 - totalImages;
      if (validFiles.length > availableSlots) {
        setError(`Only ${availableSlots} more image${availableSlots > 1 ? 's' : ''} can be added (max 5 images allowed).`);
      }
      const filesToAdd = validFiles.slice(0, availableSlots);

      const updatedFiles = [...newFiles, ...filesToAdd];
      setNewFiles(updatedFiles);

      const newPreviewUrls = filesToAdd.map(file => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    processFiles(rawFiles);
    e.target.value = '';
  };

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
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      processFiles(droppedFiles);
    }
  };

  const removeExisting = (index: number) => {
    const updated = [...existingUrls];
    updated.splice(index, 1);
    setExistingUrls(updated);

    const updatedFull = [...existingFullUrls];
    updatedFull.splice(index, 1);
    setExistingFullUrls(updatedFull);
  };

  const removeNewFile = (index: number) => {
    if (previewUrls[index]?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    const updatedFiles = [...newFiles];
    updatedFiles.splice(index, 1);
    setNewFiles(updatedFiles);

    const updatedPreviews = [...previewUrls];
    updatedPreviews.splice(index, 1);
    setPreviewUrls(updatedPreviews);
  };

  const onSubmit = async (data: EditForm) => {
    if (totalImages === 0) {
      setError('Please have at least one image for this artwork.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCompressionProgress(null);
    setUploadStage(null);

    try {
      const supabase = createClient();
      const uploadedPairs: { cardUrl: string; fullUrl: string }[] = [];
      let newCompressionResults: CompressionResult[] = [];

      // Compress and upload any newly added images
      if (newFiles.length > 0) {
        setUploadStage('Compressing new images...');
        try {
          newCompressionResults = await compressImages(newFiles, (progress) => {
            setCompressionProgress(progress);
          });
        } catch (compErr) {
          throw new Error(
            `Image compression failed: ${compErr instanceof Error ? compErr.message : 'Unknown error'}`
          );
        }

        setUploadStage('Uploading optimized images...');
        for (let i = 0; i < newCompressionResults.length; i++) {
          setUploadStage(`Uploading image ${i + 1} of ${newCompressionResults.length}...`);
          const urls = await uploadCompressedPair(supabase, userId, newCompressionResults[i], i);
          uploadedPairs.push(urls);
        }
      }

      const finalCardUrls = [...existingUrls, ...uploadedPairs.map((p) => p.cardUrl)];
      const finalFullUrls = [...existingFullUrls, ...uploadedPairs.map((p) => p.fullUrl)];

      const coverImage = finalCardUrls[0];
      const coverImageFull = finalFullUrls[0];
      const additionalImages = finalCardUrls.slice(1);
      const additionalImagesFull = finalFullUrls.slice(1);

      let finalMedium = data.artType;
      if (data.artType === 'Other') {
        const trimmed = customMediumInput.trim();
        if (!trimmed) {
          setError('Please specify your custom medium');
          setIsLoading(false);
          return;
        }
        finalMedium = trimmed;
        saveCustomMedium(trimmed);
        setCustomMediums((prev) => {
          if (prev.some((m) => m.toLowerCase() === trimmed.toLowerCase())) return prev;
          return [...prev, trimmed];
        });
      }

      const finalStyle = data.style === 'Other' ? customStyle : data.style;
      const finalCollection = data.collection === 'Other' ? customCollection.trim() : data.collection;
      if (data.collection === 'Other' && finalCollection) {
        saveCustomCollection(finalCollection);
        createCollection({ title: finalCollection }).catch(() => {});
        setCustomCollections((prev) => {
          if (prev.some((c) => c.toLowerCase() === finalCollection.toLowerCase())) return prev;
          return [...prev, finalCollection];
        });
      }
      const tagsArray = data.tags || [];

      const finalPrice = parseIndianCurrency(data.price);
      const calculatedDimensions =
        data.width && data.height && data.dimensionUnit
          ? `${data.width} × ${data.height} ${data.dimensionUnit}`
          : data.dimensions || undefined;

      setUploadStage('Saving artwork details...');
      await updateArtwork(artwork.id, {
        userId,
        title: data.title,
        artType: finalMedium,
        artistName: data.artistName,
        year: data.year,
        dimensions: calculatedDimensions,
        width: data.width,
        height: data.height,
        location: data.location,
        style: finalStyle,
        collection: finalCollection,
        tags: tagsArray,
        description: data.description,
        externalLink: data.externalLink,
        price: finalPrice,
        priceVisibility: data.priceVisibility,
        status: data.status,
        isPublished: submitAction === 'publish',
        imageUrl: coverImage,
        imageUrlFull: coverImageFull,
        additionalImages: additionalImages,
        additionalImagesFull: additionalImagesFull,
        // If a new cover image was uploaded, save its dimensions
        ...(existingUrls.length === 0 && newCompressionResults.length > 0 ? {
          imageWidth: newCompressionResults[0].originalWidth,
          imageHeight: newCompressionResults[0].originalHeight,
          aspectRatio: newCompressionResults[0].aspectRatio,
        } : {}),
      });

      router.push('/portfolio');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
      setCompressionProgress(null);
      setUploadStage(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/portfolio" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors" title="Back to Portfolio">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Edit Artwork</h2>
          <p className="text-xs text-gray-500 font-normal">Update artwork details, pricing, and availability</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Compression & Upload Progress Bar */}
      {isLoading && uploadStage && (
        <div className="mb-6 bg-gray-50 rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 size={16} className="animate-spin text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{uploadStage}</span>
          </div>
          {compressionProgress && (
            <div className="space-y-1">
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gray-900 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.round(
                      ((compressionProgress.fileIndex * 100 + compressionProgress.percent) /
                        (compressionProgress.totalFiles * 100)) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-500">
                File {compressionProgress.fileIndex + 1} of {compressionProgress.totalFiles}
                {compressionProgress.stage !== 'complete' && ` — ${compressionProgress.stage.replace(/-/g, ' ')}`}
              </p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Editable Image Gallery */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Artwork Images * (First image is the cover)
          </label>
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4"
          >
            {/* Existing Images */}
            {existingUrls.map((url, idx) => (
              <div key={`existing-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                <img src={url} alt={`Existing ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => removeExisting(idx)}
                    className="bg-red-500 text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-600 shadow-lg transform hover:scale-105 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {idx === 0 && (
                  <div className="absolute bottom-2 left-2 bg-gray-900/90 text-white text-[10px] font-bold px-2 py-1 rounded">
                    COVER
                  </div>
                )}
              </div>
            ))}

            {/* New Image Previews */}
            {previewUrls.map((url, idx) => (
              <div key={`new-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-blue-200">
                <img src={url} alt={`New Preview ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    type="button"
                    onClick={() => removeNewFile(idx)}
                    className="bg-red-500 text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-600 shadow-lg transform hover:scale-105 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {existingUrls.length === 0 && idx === 0 && (
                  <div className="absolute bottom-2 left-2 bg-gray-900/90 text-white text-[10px] font-bold px-2 py-1 rounded z-0">
                    COVER
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded z-0">
                  NEW
                </div>
              </div>
            ))}

            {/* Add More Button */}
            {totalImages < 5 && (
              <div
                className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/60'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <Upload size={18} className={isDragging ? 'text-blue-600' : 'text-gray-400'} />
                </div>
                <p className="font-semibold text-gray-900 text-xs">
                  {isDragging ? 'Drop Image Here' : 'Add Image'}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">{5 - totalImages} slots left (max {MAX_INPUT_SIZE_MB} MB each)</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            id="edit-file-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Title *" placeholder="Name of the artwork" error={errors.title?.message} {...register('title')} />
          <Input label="Artist Name *" placeholder="Who created this?" error={errors.artistName?.message} {...register('artistName')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex flex-col gap-2">
            <Select
              label="Medium *"
              options={mediumOptions}
              placeholder="Select Medium"
              error={errors.artType?.message}
              {...register('artType')}
            />
            {selectedMedium === 'Other' && (
              <Input
                autoFocus
                label="Custom Medium"
                placeholder="Specify your medium..."
                value={customMediumInput}
                onChange={(e) => setCustomMediumInput(e.target.value)}
                onBlur={() => {
                  const trimmed = customMediumInput.trim();
                  if (trimmed && trimmed.toLowerCase() !== 'other') {
                    saveCustomMedium(trimmed);
                    setCustomMediums((prev) => {
                      if (prev.some((m) => m.toLowerCase() === trimmed.toLowerCase())) return prev;
                      return [...prev, trimmed];
                    });
                  }
                }}
              />
            )}
          </div>
          <Input label="Year" placeholder="e.g. 2024" error={errors.year?.message} {...register('year')} />

          <div className="flex flex-col gap-2">
            <Select
              label="Dimension Unit"
              options={DIMENSION_UNIT_OPTIONS}
              placeholder="Select Unit (e.g. in, cm, px)"
              error={errors.dimensionUnit?.message}
              {...register('dimensionUnit')}
            />

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  style={{ color: '#929292', fontWeight: 500 }}
                  className="block text-xs mb-1"
                >
                  Dimensions
                </label>
                {!selectedDimensionUnit && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-normal mb-1">
                    Select unit first
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step={selectedDimensionUnit === 'px' ? '1' : '0.1'}
                  min={selectedDimensionUnit === 'px' ? '1' : '0.1'}
                  placeholder={selectedDimensionUnit ? `W (${selectedDimensionUnit})` : 'Select unit first'}
                  disabled={!selectedDimensionUnit}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full px-2 py-3 text-sm bg-transparent border-b-2 outline-none transition-all placeholder:text-gray-400 text-center ${
                    !selectedDimensionUnit
                      ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50/50'
                      : errors.width
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-gray-900'
                  }`}
                  {...register('width')}
                />
                <span className={`text-[10px] ${!selectedDimensionUnit ? 'text-gray-300' : 'text-gray-400'}`}>✕</span>
                <input
                  type="number"
                  step={selectedDimensionUnit === 'px' ? '1' : '0.1'}
                  min={selectedDimensionUnit === 'px' ? '1' : '0.1'}
                  placeholder={selectedDimensionUnit ? `H (${selectedDimensionUnit})` : 'Select unit first'}
                  disabled={!selectedDimensionUnit}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full px-2 py-3 text-sm bg-transparent border-b-2 outline-none transition-all placeholder:text-gray-400 text-center ${
                    !selectedDimensionUnit
                      ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50/50'
                      : errors.height
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-gray-900'
                  }`}
                  {...register('height')}
                />
              </div>
              {(errors.width || errors.height) && (
                <p className="text-[11px] text-red-500 font-normal mt-1">
                  {errors.width?.message || errors.height?.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Input label="Location" placeholder="e.g. New York, NY" error={errors.location?.message} {...register('location')} />

          <div className="flex flex-col gap-2">
            <Select label="Style" options={styleOptions} placeholder="Select Style" error={errors.style?.message} {...register('style')} />
            {selectedStyle === 'Other' && (
              <Input autoFocus label="Custom Style" placeholder="Specify your style..." value={customStyle} onChange={(e) => setCustomStyle(e.target.value)} />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Select label="Collection" options={collectionOptions} placeholder="Select Collection" error={errors.collection?.message} {...register('collection')} />
            {selectedCollection === 'Other' && (
              <Input
                autoFocus
                label="Custom Collection"
                placeholder="Specify collection name..."
                value={customCollection}
                onChange={(e) => setCustomCollection(e.target.value)}
                onBlur={() => {
                  const trimmed = customCollection.trim();
                  if (trimmed && trimmed.toLowerCase() !== 'other') {
                    saveCustomCollection(trimmed);
                    setCustomCollections((prev) => {
                      if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prev;
                      return [...prev, trimmed];
                    });
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex flex-col gap-2">
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label="Tags"
                  options={tagsOptions}
                  placeholder="Select Tags"
                  value={field.value || []}
                  onChange={field.onChange}
                  error={errors.tags?.message}
                />
              )}
            />
          </div>
          <Select label="Availability" options={availabilityOptions} error={errors.status?.message} {...register('status')} />
          <Select label="Price Visibility" options={visibilityOptions} error={errors.priceVisibility?.message} {...register('priceVisibility')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <Input
                label={
                  selectedPriceVisibility === 'Hide Price'
                    ? 'Price · Hidden from public view'
                    : selectedPriceVisibility === 'Price on Request'
                    ? 'Price · Will display as "On Request"'
                    : 'Price'
                }
                type="text"
                inputMode="numeric"
                placeholder="0"
                helperText={`Max amount: ${MAX_PRICE_INR_FORMATTED}`}
                error={errors.price?.message}
                value={field.value || ''}
                onChange={(e) => {
                  const formatted = formatIndianCurrency(e.target.value);
                  field.onChange(formatted);
                }}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
              />
            )}
          />
          <div className="relative">
            <Input label="Related Link" placeholder="https://..." error={errors.externalLink?.message} {...register('externalLink')} />
            <LinkIcon className="absolute right-3 top-9 text-gray-400" size={16} />
          </div>
        </div>

        <TextArea label="Description" placeholder="Tell collectors about this piece..." error={errors.description?.message} {...register('description')} />

        <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-6 border-t border-gray-100">
          {/* Blue Gradient Publish Button */}
          <button
            type="submit"
            disabled={isLoading}
            onClick={() => setSubmitAction('publish')}
            style={{
              position: 'relative',
              background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
              boxShadow:
                '0px 7px 22px rgba(35, 77, 255, 0.13), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
              overflow: 'hidden',
              borderRadius: 40,
              outline: '2px #2356FF solid',
              outlineOffset: '-2px',
            }}
            className="w-full sm:w-auto px-8 py-3.5 sm:px-10 sm:py-4 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group select-none shadow-md"
          >
            <div
              style={{
                position: 'absolute',
                inset: 3,
                borderRadius: 37,
                border: '1px rgba(255, 255, 255, 0.15) solid',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                color: 'white',
                fontSize: 16,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                fontWeight: '600',
                lineHeight: '24px',
              }}
              className="flex items-center gap-2 relative z-10"
            >
              {isLoading && submitAction === 'publish' ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <ImageIcon size={18} className="text-white" />
                  <span>Publish</span>
                </>
              )}
            </div>
          </button>

          {/* Black Save Draft Button */}
          <button
            type="submit"
            disabled={isLoading}
            onClick={() => setSubmitAction('draft')}
            style={{
              position: 'relative',
              background: '#181A1F',
              overflow: 'hidden',
              borderRadius: 40,
            }}
            className="w-full sm:w-auto px-8 py-3.5 sm:px-10 sm:py-4 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:bg-black active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-md select-none"
          >
            <span
              style={{
                color: 'white',
                fontSize: 15,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                fontWeight: '600',
                lineHeight: '24px',
              }}
              className="flex items-center gap-2 relative z-10"
            >
              {isLoading && submitAction === 'draft' ? (
                <>
                  <Loader2 size={17} className="animate-spin text-white" />
                  <span>Saving Draft...</span>
                </>
              ) : (
                <>
                  <Save size={17} className="text-white" />
                  <span>Save Draft</span>
                </>
              )}
            </span>
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={() => router.push('/portfolio')}
            style={{
              position: 'relative',
              background: '#F3F3F3',
              overflow: 'hidden',
              borderRadius: 40,
            }}
            className="w-full sm:w-auto px-8 py-3.5 sm:px-10 sm:py-4 inline-flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-[#E5E5E5] active:scale-[0.98] select-none"
          >
            <span
              style={{
                color: '#343434',
                fontSize: 15,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                fontWeight: '600',
                lineHeight: '24px',
                textAlign: 'center',
              }}
              className="relative z-10"
            >
              Cancel
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

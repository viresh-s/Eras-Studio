'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  X,
  Loader2,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createArtworksBulkAction, type BulkArtworkInput } from '@/actions/artworkActions';
import type { FreemiumStatus } from '@/lib/freemium/check';
import type { CollectionItem } from '@/actions/collectionActions';
import type { Profile } from '@/types/database';
import { validateImageFile } from '@/lib/media/imagePipeline';
import { processBatchUpload, type BatchProgressEvent } from '@/lib/media/batchUploadQueue';
import {
  formatIndianCurrency,
  parseIndianCurrency,
} from '@/lib/constants/currency';
import { buildMediumOptions, getCustomMediums } from '@/lib/constants/mediums';
import { buildStyleOptions, getCustomStyles } from '@/lib/constants/styles';
import { DIMENSION_UNIT_OPTIONS, getUnitSymbol } from '@/lib/constants/dimensions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BulkFileItem {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  artType: string;
  year: string;
  price: string;
  priceVisibility: string;
  status: string;
  collection: string;
  style: string;
  width: string;
  height: string;
  dimensionUnit: string;
  nativeWidth: number;
  nativeHeight: number;
  isValid: boolean;
  error?: string;
}

interface BulkArtworkUploadProps {
  userId: string;
  profile: Profile | null;
  collections: CollectionItem[];
  freemiumStatus: FreemiumStatus;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

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

/** Return the max files for the current plan based on quota */
function getBatchLimit(freemiumStatus: FreemiumStatus): number {
  if (freemiumStatus.artworksLimit === -1) return 25; // Unlimited plan → cap at 25 per batch
  const remaining = Math.max(0, freemiumStatus.artworksLimit - (freemiumStatus.artworksUsed || 0));
  const planMaxBatch = freemiumStatus.artworksLimit >= 50 ? 15 : 3;
  return Math.min(planMaxBatch, remaining);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BulkArtworkUpload({
  userId,
  profile,
  collections,
  freemiumStatus,
}: BulkArtworkUploadProps) {
  const router = useRouter();

  // --- Core state ---
  const [files, setFiles] = useState<BulkFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{
    current: number;
    total: number;
    stage: string;
  } | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Track per-file processing status in the modal
  const [fileStatuses, setFileStatuses] = useState<
    Record<number, 'pending' | 'compressing' | 'uploading' | 'done' | 'error'>
  >({});

  // Drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply-to-all ribbon state
  const [applyMedium, setApplyMedium] = useState('');
  const [applyYear, setApplyYear] = useState('');
  const [applyCollection, setApplyCollection] = useState('');
  const [applyPriceVisibility, setApplyPriceVisibility] = useState('');
  const [applyStatus, setApplyStatus] = useState('');

  // Expand state for details (works on desktop and mobile)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // --- Memoized option lists ---
  const [customMediums, setCustomMediums] = useState<string[]>([]);
  const [customStyles, setCustomStyles] = useState<string[]>([]);

  useEffect(() => {
    setCustomMediums(getCustomMediums());
    setCustomStyles(getCustomStyles());
  }, []);

  const mediumOptions = useMemo(
    () => buildMediumOptions(customMediums),
    [customMediums]
  );

  const styleOptions = useMemo(
    () => buildStyleOptions(customStyles),
    [customStyles]
  );

  const batchLimit = useMemo(() => getBatchLimit(freemiumStatus), [freemiumStatus]);

  // Remaining total quota
  const remainingSlots = useMemo(() => {
    if (freemiumStatus.artworksLimit === -1) return Infinity;
    return Math.max(0, freemiumStatus.artworksLimit - (freemiumStatus.artworksUsed || 0));
  }, [freemiumStatus]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // File Handling
  // ---------------------------------------------------------------------------

  const addFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const newFiles = Array.from(incoming);
      const remaining = batchLimit - files.length;

      if (batchLimit === 0) {
        setGlobalError(
          'Your plan limit has been reached. Please upgrade to Pro for unlimited artwork uploads.'
        );
        return;
      }

      if (remaining <= 0) {
        setGlobalError(`Batch limit reached (${batchLimit} files). Remove some files to add more.`);
        return;
      }

      const toProcess = newFiles.slice(0, remaining);
      if (newFiles.length > remaining) {
        setGlobalError(`Only ${remaining} more file(s) allowed. ${newFiles.length - remaining} file(s) were skipped.`);
      } else {
        setGlobalError(null);
      }

      const items: BulkFileItem[] = [];

      for (const file of toProcess) {
        try {
          validateImageFile(file);
        } catch (err: any) {
          setGlobalError(err.message || 'Invalid file');
          continue;
        }

        const previewUrl = URL.createObjectURL(file);

        // Read native dimensions
        const dims = await new Promise<{ w: number; h: number }>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => resolve({ w: 0, h: 0 });
          img.src = previewUrl;
        });

        items.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          previewUrl,
          title: extractTitleFromFilename(file.name),
          artType: applyMedium || 'Painting',
          year: applyYear || new Date().getFullYear().toString(),
          price: '',
          priceVisibility: applyPriceVisibility || 'Show Price',
          status: applyStatus || 'Available',
          collection: applyCollection || '',
          style: '',
          width: '',
          height: '',
          dimensionUnit: 'in',
          nativeWidth: dims.w,
          nativeHeight: dims.h,
          isValid: true,
        });
      }

      setFiles(prev => [...prev, ...items]);
    },
    [batchLimit, files.length, applyMedium, applyYear, applyPriceVisibility, applyStatus, applyCollection]
  );

  // Drag & drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      if (e.dataTransfer.files?.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles]
  );

  // ---------------------------------------------------------------------------
  // Row Editing
  // ---------------------------------------------------------------------------

  const updateFile = useCallback((id: string, patch: Partial<BulkFileItem>) => {
    setFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, ...patch } : f))
    );
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const removed = prev.find(f => f.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Apply to All
  // ---------------------------------------------------------------------------

  const handleApplyToAll = useCallback(() => {
    setFiles(prev =>
      prev.map(f => ({
        ...f,
        ...(applyMedium ? { artType: applyMedium } : {}),
        ...(applyYear ? { year: applyYear } : {}),
        ...(applyCollection ? { collection: applyCollection } : {}),
        ...(applyPriceVisibility ? { priceVisibility: applyPriceVisibility } : {}),
        ...(applyStatus ? { status: applyStatus } : {}),
      }))
    );
  }, [applyMedium, applyYear, applyCollection, applyPriceVisibility, applyStatus]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validateAll = useCallback((): boolean => {
    let valid = true;
    setFiles(prev =>
      prev.map(f => {
        const titleEmpty = !f.title.trim();
        const priceInvalid = f.price.trim()
          ? parseIndianCurrency(f.price) === null
          : false;
        const hasError = titleEmpty || priceInvalid;
        if (hasError) valid = false;
        return {
          ...f,
          isValid: !hasError,
          error: titleEmpty
            ? 'Title is required'
            : priceInvalid
              ? 'Invalid price'
              : undefined,
        };
      })
    );
    return valid;
  }, []);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (files.length === 0) {
      setGlobalError('Please add at least one file.');
      return;
    }

    if (!validateAll()) {
      setGlobalError('Please fix validation errors before publishing.');
      return;
    }

    // Quota check
    const remaining = freemiumStatus.artworksLimit === -1
      ? Infinity
      : freemiumStatus.artworksLimit - (freemiumStatus.artworksUsed || 0);

    if (files.length > remaining) {
      setGlobalError(
        `You can only upload ${remaining} more artwork(s) on your current plan. Remove ${files.length - remaining} file(s) or upgrade.`
      );
      return;
    }

    setGlobalError(null);
    setIsProcessing(true);

    // Init per-file statuses
    const initialStatuses: Record<number, 'pending' | 'compressing' | 'uploading' | 'done' | 'error'> = {};
    files.forEach((_, i) => { initialStatuses[i] = 'pending'; });
    setFileStatuses(initialStatuses);
    setProcessingProgress({ current: 0, total: files.length, stage: 'Compressing images...' });

    try {
      const supabase = createClient();

      const onProgress = (event: BatchProgressEvent) => {
        setFileStatuses(prev => ({ ...prev, [event.fileIndex]: event.status }));
        const doneCount = Object.values({ ...fileStatuses, [event.fileIndex]: event.status })
          .filter(s => s === 'done' || s === 'error').length;
        setProcessingProgress({
          current: doneCount,
          total: event.totalFiles,
          stage:
            event.status === 'compressing'
              ? `Compressing image ${event.fileIndex + 1} of ${event.totalFiles}...`
              : event.status === 'uploading'
                ? `Uploading optimized image ${event.fileIndex + 1} of ${event.totalFiles}...`
                : event.status === 'done'
                  ? `Uploaded ${doneCount} of ${event.totalFiles}`
                  : `Error on file ${event.fileIndex + 1}`,
        });
      };

      // 1. Upload all images concurrently
      const batchResult = await processBatchUpload(
        files.map(f => f.file),
        supabase,
        userId,
        onProgress
      );

      // Check if all failed
      const successCount = batchResult.results.filter(r => r !== null).length;
      if (successCount === 0) {
        throw new Error('All uploads failed. Please check your image files and try again.');
      }

      setProcessingProgress({
        current: files.length,
        total: files.length,
        stage: 'Saving artworks to portfolio...',
      });

      // 2. Build bulk action input
      const bulkItems: BulkArtworkInput[] = [];

      for (let i = 0; i < files.length; i++) {
        const uploadResult = batchResult.results[i];
        if (!uploadResult) continue; // Skip failed uploads

        const f = files[i];
        const dimStr =
          f.width && f.height
            ? `${f.width} × ${f.height} ${getUnitSymbol(f.dimensionUnit)}`
            : undefined;

        bulkItems.push({
          title: f.title.trim(),
          artType: f.artType || 'Painting',
          artistName: profile?.full_name || 'Artist',
          year: f.year || undefined,
          price: f.price ? parseIndianCurrency(f.price) : null,
          priceVisibility: f.priceVisibility,
          status: f.status,
          collectionId: f.collection || null,
          collection: f.collection
            ? collections.find(c => c.id === f.collection)?.title || f.collection
            : null,
          dimensions: dimStr,
          width: f.width || undefined,
          height: f.height || undefined,
          style: f.style || undefined,
          cardUrl: uploadResult.cardUrl,
          fullUrl: uploadResult.fullUrl,
          imageWidth: uploadResult.meta.originalWidth,
          imageHeight: uploadResult.meta.originalHeight,
          aspectRatio: uploadResult.meta.aspectRatio,
        });
      }

      // 3. Save to database atomically
      const result = await createArtworksBulkAction(bulkItems);

      if (!result.success) {
        throw new Error((result as any).error || 'Failed to save artworks');
      }

      // 4. Navigate to portfolio on success
      router.push('/portfolio');
      router.refresh();
    } catch (err: any) {
      setGlobalError(err?.message || 'An unexpected error occurred during bulk upload.');
      setIsProcessing(false);
      setProcessingProgress(null);
    }
  }, [files, validateAll, freemiumStatus, userId, profile, collections, router, fileStatuses]);

  // ---------------------------------------------------------------------------
  // Card toggle
  // ---------------------------------------------------------------------------

  const toggleCard = useCallback((id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8 text-center sm:text-left">
        <h1
          className="text-2xl sm:text-3xl font-bold text-[#141413] tracking-normal"
          style={{ fontFamily: 'var(--font-century-schoolbook-italic)' }}
        >
          Bulk Upload Artworks
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6E69] mt-1.5 max-w-2xl">
          Upload up to {batchLimit} artworks in a single batch. Adjust titles, mediums, prices, and dimensions individually or apply shared details across the entire collection.
        </p>
      </div>

      {/* Global Error Banner */}
      {globalError && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
          <X className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Quota Limit Warning */}
      {remainingSlots <= 0 && freemiumStatus.artworksLimit !== -1 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>You have reached your plan limit ({freemiumStatus.artworksLimit} artworks). Upgrade to Pro for unlimited uploads.</span>
          <button
            type="button"
            onClick={() => router.push('/subscription')}
            className="px-4 py-1.5 text-xs font-semibold text-white rounded-full self-start sm:self-auto"
            style={{
              background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
            }}
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* ================================================================== */}
      {/* Section 1 — Multi-File Dropzone                                    */}
      {/* ================================================================== */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200
          flex flex-col items-center justify-center py-10 sm:py-14 px-6 mb-6 select-none
          ${isDragging
            ? 'border-[#1345EE] bg-blue-50/60 shadow-md scale-[1.005]'
            : files.length > 0
              ? 'border-[#E8E8E3] bg-[#F8F7F4] hover:border-[#1345EE]/50 hover:bg-white'
              : 'border-[#E8E8E3] bg-white hover:border-[#1345EE]/50 shadow-xs'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/bmp,image/gif,image/tiff"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-transform duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
            }}
          >
            <Upload className="w-6 h-6 text-white" />
          </div>

          <div>
            <p className="text-base sm:text-lg font-semibold text-[#141413]">
              {isDragging ? 'Drop your artwork images here' : 'Drag & drop artwork images'}
            </p>
            <p className="text-xs sm:text-sm text-[#6E6E69] mt-1 max-w-md">
              or <span className="text-[#1345EE] underline font-medium">browse files</span> from your device. Supported: JPEG, PNG, WebP (up to 50 MB each)
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-[#1345EE] font-medium border border-blue-100">
              {files.length} of {batchLimit} artworks added
            </span>
            {freemiumStatus.artworksLimit !== -1 && (
              <span className="text-xs text-[#6E6E69]">
                ({remainingSlots} remaining on plan)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Section 2 — "Apply to All" Ribbon                                  */}
      {/* ================================================================== */}
      {files.length > 0 && (
        <div
          className="sticky top-2 z-20 bg-white/95 backdrop-blur-md border border-[#E8E8E3] rounded-2xl p-4 sm:p-5 mb-6 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-[#141413] uppercase tracking-wider">
              Apply to All Artworks
            </span>
            <span className="text-[11px] text-[#6E6E69]">
              Set shared values once across the entire batch
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 items-end">
            {/* Medium */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[11px] text-[#6E6E69] font-medium">Medium</label>
              <select
                value={applyMedium}
                onChange={e => setApplyMedium(e.target.value)}
                className="input-gradient-border-sm text-xs sm:text-sm rounded-lg px-2.5 py-2 bg-white text-[#141413] truncate"
              >
                <option value="">Choose medium</option>
                {mediumOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[11px] text-[#6E6E69] font-medium">Creation Year</label>
              <input
                type="text"
                value={applyYear}
                onChange={e => setApplyYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder={new Date().getFullYear().toString()}
                className="input-gradient-border-sm text-xs sm:text-sm rounded-lg px-2.5 py-2 bg-white text-[#141413]"
              />
            </div>

            {/* Collection */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[11px] text-[#6E6E69] font-medium">Collection</label>
              <select
                value={applyCollection}
                onChange={e => setApplyCollection(e.target.value)}
                className="input-gradient-border-sm text-xs sm:text-sm rounded-lg px-2.5 py-2 bg-white text-[#141413] truncate"
              >
                <option value="">No collection</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Price Visibility */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[11px] text-[#6E6E69] font-medium">Price Visibility</label>
              <select
                value={applyPriceVisibility}
                onChange={e => setApplyPriceVisibility(e.target.value)}
                className="input-gradient-border-sm text-xs sm:text-sm rounded-lg px-2.5 py-2 bg-white text-[#141413] truncate"
              >
                <option value="">Choose visibility</option>
                {visibilityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[11px] text-[#6E6E69] font-medium">Availability</label>
              <select
                value={applyStatus}
                onChange={e => setApplyStatus(e.target.value)}
                className="input-gradient-border-sm text-xs sm:text-sm rounded-lg px-2.5 py-2 bg-white text-[#141413] truncate"
              >
                <option value="">Choose status</option>
                {availabilityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={handleApplyToAll}
              className="h-[38px] px-4 text-xs font-semibold text-white rounded-full transition-all duration-200 hover:brightness-110 active:scale-[0.98] select-none flex items-center justify-center shadow-sm"
              style={{
                background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
              }}
            >
              Apply to All
            </button>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Section 3 — Spreadsheet Grid (Desktop) / Card View (Mobile)        */}
      {/* ================================================================== */}
      {files.length > 0 && (
        <>
          {/* ---- Desktop Table (md+) ---- */}
          <div className="hidden md:block mb-8 bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F7] border-b border-[#E8E8E3] text-left text-[11px] text-[#6E6E69] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3 w-[56px] text-center">Preview</th>
                    <th className="py-3 px-3 min-w-[200px]">Title *</th>
                    <th className="py-3 px-3 w-[160px]">Medium</th>
                    <th className="py-3 px-3 w-[130px]">Price (₹)</th>
                    <th className="py-3 px-3 w-[210px]">Dimensions (W × H)</th>
                    <th className="py-3 px-3 w-[150px]">Collection</th>
                    <th className="py-3 px-3 w-[90px] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E3]">
                  {files.map((f) => {
                    const isExpanded = expandedCards.has(f.id);

                    return (
                      <React.Fragment key={f.id}>
                        <tr
                          className={`group transition-colors ${!f.isValid ? 'bg-red-50/40' : 'hover:bg-[#F8F7F4]/70'
                            }`}
                        >
                          {/* Thumbnail */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#F2F0ED] mx-auto flex items-center justify-center border border-[#E8E8E3]/60 shadow-2xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={f.previewUrl}
                                alt={f.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </td>

                          {/* Title */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={f.title}
                              onChange={e => updateFile(f.id, { title: e.target.value })}
                              placeholder="Artwork title"
                              className={`input-gradient-border-sm w-full text-xs sm:text-sm rounded-lg px-3 py-2 bg-white text-[#141413] ${!f.isValid && !f.title.trim()
                                ? 'ring-2 ring-red-400 border-red-400'
                                : ''
                                }`}
                            />
                            {!f.isValid && f.error && (
                              <p className="text-[11px] text-red-500 mt-0.5">{f.error}</p>
                            )}
                          </td>

                          {/* Medium */}
                          <td className="py-2.5 px-3">
                            <select
                              value={f.artType}
                              onChange={e => updateFile(f.id, { artType: e.target.value })}
                              className="input-gradient-border-sm w-full text-xs sm:text-sm rounded-lg px-2.5 py-2 bg-white text-[#141413]"
                            >
                              <option value="">Select medium</option>
                              {mediumOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </td>

                          {/* Price */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={f.price}
                              onChange={e => updateFile(f.id, { price: e.target.value.replace(/[^0-9,]/g, '') })}
                              onBlur={() => {
                                const parsed = parseIndianCurrency(f.price);
                                updateFile(f.id, {
                                  price: parsed ? formatIndianCurrency(parsed) : f.price,
                                });
                              }}
                              placeholder="₹ Optional"
                              className={`input-gradient-border-sm w-full text-xs sm:text-sm rounded-lg px-3 py-2 bg-white text-[#141413] ${!f.isValid && f.error === 'Invalid price'
                                ? 'ring-2 ring-red-400 border-red-400'
                                : ''
                                }`}
                            />
                          </td>

                          {/* Dimensions */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={f.width}
                                onChange={e =>
                                  updateFile(f.id, { width: e.target.value.replace(/\D/g, '') })
                                }
                                placeholder="W"
                                className="input-gradient-border-sm w-14 text-xs sm:text-sm rounded-lg px-2 py-2 bg-white text-[#141413] text-center"
                              />
                              <span className="text-[#6E6E69] text-xs">×</span>
                              <input
                                type="text"
                                value={f.height}
                                onChange={e =>
                                  updateFile(f.id, { height: e.target.value.replace(/\D/g, '') })
                                }
                                placeholder="H"
                                className="input-gradient-border-sm w-14 text-xs sm:text-sm rounded-lg px-2 py-2 bg-white text-[#141413] text-center"
                              />
                              <select
                                value={f.dimensionUnit}
                                onChange={e => updateFile(f.id, { dimensionUnit: e.target.value })}
                                className="input-gradient-border-sm text-xs rounded-lg px-1.5 py-2 bg-white text-[#141413] w-14"
                              >
                                {DIMENSION_UNIT_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.symbol}</option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* Collection */}
                          <td className="py-2.5 px-3">
                            <select
                              value={f.collection}
                              onChange={e => updateFile(f.id, { collection: e.target.value })}
                              className="input-gradient-border-sm w-full text-xs sm:text-sm rounded-lg px-2.5 py-2 bg-white text-[#141413]"
                            >
                              <option value="">None</option>
                              {collections.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                              ))}
                            </select>
                          </td>

                          {/* Action Buttons: Expand Details & Delete */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleCard(f.id)}
                                className="p-1.5 rounded-lg text-[#6E6E69] hover:text-[#1345EE] hover:bg-blue-50 transition-colors"
                                title="Edit more details"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFile(f.id)}
                                className="p-1.5 rounded-lg text-[#6E6E69] hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Remove artwork"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable row for extra fields on desktop */}
                        {isExpanded && (
                          <tr className="bg-[#FAF9F7]/80">
                            <td colSpan={7} className="px-6 py-3 border-b border-[#E8E8E3]">
                              <div className="grid grid-cols-4 gap-4 items-center">
                                {/* Year */}
                                <div>
                                  <label className="text-[11px] text-[#6E6E69] font-medium block mb-1">Creation Year</label>
                                  <input
                                    type="text"
                                    value={f.year}
                                    onChange={e => updateFile(f.id, { year: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                    placeholder={new Date().getFullYear().toString()}
                                    className="input-gradient-border-sm w-full text-xs rounded-lg px-2.5 py-1.5 bg-white text-[#141413]"
                                  />
                                </div>

                                {/* Style */}
                                <div>
                                  <label className="text-[11px] text-[#6E6E69] font-medium block mb-1">Artistic Style</label>
                                  <select
                                    value={f.style}
                                    onChange={e => updateFile(f.id, { style: e.target.value })}
                                    className="input-gradient-border-sm w-full text-xs rounded-lg px-2.5 py-1.5 bg-white text-[#141413]"
                                  >
                                    <option value="">Select style</option>
                                    {styleOptions.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Price Visibility */}
                                <div>
                                  <label className="text-[11px] text-[#6E6E69] font-medium block mb-1">Price Visibility</label>
                                  <select
                                    value={f.priceVisibility}
                                    onChange={e => updateFile(f.id, { priceVisibility: e.target.value })}
                                    className="input-gradient-border-sm w-full text-xs rounded-lg px-2.5 py-1.5 bg-white text-[#141413]"
                                  >
                                    {visibilityOptions.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Availability Status */}
                                <div>
                                  <label className="text-[11px] text-[#6E6E69] font-medium block mb-1">Status</label>
                                  <select
                                    value={f.status}
                                    onChange={e => updateFile(f.id, { status: e.target.value })}
                                    className="input-gradient-border-sm w-full text-xs rounded-lg px-2.5 py-1.5 bg-white text-[#141413]"
                                  >
                                    {availabilityOptions.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---- Mobile Card View (below md) ---- */}
          <div className="md:hidden flex flex-col gap-4 mb-8">
            {files.map((f) => (
              <div
                key={f.id}
                className={`border rounded-2xl p-4 bg-white shadow-xs transition-shadow ${!f.isValid ? 'border-red-300 bg-red-50/20' : 'border-[#E8E8E3]'
                  }`}
              >
                {/* Header: Thumbnail + Title + Delete */}
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F2F0ED] shrink-0 border border-[#E8E8E3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.previewUrl}
                      alt={f.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={f.title}
                      onChange={e => updateFile(f.id, { title: e.target.value })}
                      placeholder="Artwork title"
                      className={`input-gradient-border-sm w-full text-sm rounded-lg px-3 py-2 bg-white text-[#141413] ${!f.isValid && !f.title.trim()
                        ? 'ring-2 ring-red-400 border-red-400'
                        : ''
                        }`}
                    />
                    {!f.isValid && f.error && (
                      <p className="text-xs text-red-500 mt-1">{f.error}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    className="p-2 rounded-lg text-[#6E6E69] hover:text-red-500 hover:bg-red-50 shrink-0"
                    aria-label="Remove artwork"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary Mobile Controls */}
                <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-[#E8E8E3]/60">
                  <div>
                    <label className="text-[11px] text-[#6E6E69]">Medium</label>
                    <select
                      value={f.artType}
                      onChange={e => updateFile(f.id, { artType: e.target.value })}
                      className="input-gradient-border-sm w-full text-xs rounded-lg px-2.5 py-1.5 bg-white text-[#141413]"
                    >
                      <option value="">Select medium</option>
                      {mediumOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#6E6E69]">Price (₹)</label>
                    <input
                      type="text"
                      value={f.price}
                      onChange={e =>
                        updateFile(f.id, { price: e.target.value.replace(/[^0-9,]/g, '') })
                      }
                      onBlur={() => {
                        const parsed = parseIndianCurrency(f.price);
                        updateFile(f.id, {
                          price: parsed ? formatIndianCurrency(parsed) : f.price,
                        });
                      }}
                      placeholder="₹ Optional"
                      className="input-gradient-border-sm w-full text-xs rounded-lg px-2.5 py-1.5 bg-white text-[#141413]"
                    />
                  </div>
                </div>

                {/* Expand / Collapse More Details */}
                <button
                  type="button"
                  onClick={() => toggleCard(f.id)}
                  className="mt-3 w-full text-xs text-[#1345EE] font-medium flex items-center justify-center gap-1 py-1 hover:underline select-none"
                >
                  <span>{expandedCards.has(f.id) ? 'Hide details' : 'More details (dimensions, year, style)'}</span>
                  {expandedCards.has(f.id) ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Expanded Details */}
                {expandedCards.has(f.id) && (
                  <div className="mt-3 pt-3 border-t border-[#E8E8E3] grid grid-cols-2 gap-3 animate-fadeIn">
                    {/* Dimensions */}
                    <div className="col-span-2">
                      <label className="text-[11px] text-[#6E6E69]">Dimensions</label>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                          type="text"
                          value={f.width}
                          onChange={e =>
                            updateFile(f.id, { width: e.target.value.replace(/\D/g, '') })
                          }
                          placeholder="Width"
                          className="input-gradient-border-sm flex-1 text-xs rounded-lg px-2.5 py-1.5 bg-white text-[#141413] text-center"
                        />
                        <span className="text-[#6E6E69] text-xs">×</span>
                        <input
                          type="text"
                          value={f.height}
                          onChange={e =>
                            updateFile(f.id, { height: e.target.value.replace(/\D/g, '') })
                          }
                          placeholder="Height"
                          className="input-gradient-border-sm flex-1 text-xs rounded-lg px-2.5 py-1.5 bg-white text-[#141413] text-center"
                        />
                        <select
                          value={f.dimensionUnit}
                          onChange={e => updateFile(f.id, { dimensionUnit: e.target.value })}
                          className="input-gradient-border-sm text-xs rounded-lg px-2 py-1.5 bg-white text-[#141413] w-16"
                        >
                          {DIMENSION_UNIT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.symbol}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Year */}
                    <div>
                      <label className="text-[11px] text-[#6E6E69]">Year</label>
                      <input
                        type="text"
                        value={f.year}
                        onChange={e => updateFile(f.id, { year: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        placeholder={new Date().getFullYear().toString()}
                        className="input-gradient-border-sm w-full text-xs rounded-lg px-2.5 py-1.5 bg-white text-[#141413]"
                      />
                    </div>

                    {/* Style */}
                    <div>
                      <label className="text-[11px] text-[#6E6E69]">Style</label>
                      <select
                        value={f.style}
                        onChange={e => updateFile(f.id, { style: e.target.value })}
                        className="input-gradient-border-sm w-full text-xs rounded-lg px-2.5 py-1.5 bg-white text-[#141413]"
                      >
                        <option value="">Select style</option>
                        {styleOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Collection */}
                    <div>
                      <label className="text-[11px] text-[#6E6E69]">Collection</label>
                      <select
                        value={f.collection}
                        onChange={e => updateFile(f.id, { collection: e.target.value })}
                        className="input-gradient-border-sm w-full text-xs rounded-lg px-2.5 py-1.5 bg-white text-[#141413]"
                      >
                        <option value="">No collection</option>
                        {collections.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>

                    {/* Visibility */}
                    <div>
                      <label className="text-[11px] text-[#6E6E69]">Visibility</label>
                      <select
                        value={f.priceVisibility}
                        onChange={e => updateFile(f.id, { priceVisibility: e.target.value })}
                        className="input-gradient-border-sm w-full text-xs rounded-lg px-2.5 py-1.5 bg-white text-[#141413]"
                      >
                        {visibilityOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <label className="text-[11px] text-[#6E6E69]">Status</label>
                      <select
                        value={f.status}
                        onChange={e => updateFile(f.id, { status: e.target.value })}
                        className="input-gradient-border-sm w-full text-xs rounded-lg px-2.5 py-1.5 bg-white text-[#141413]"
                      >
                        {availabilityOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ================================================================== */}
      {/* Section 4 — Sticky Bottom Action Bar                               */}
      {/* ================================================================== */}
      {files.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 bg-white border border-[#E8E8E3] rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-semibold text-[#141413]">
              {files.length} artwork{files.length !== 1 ? 's' : ''} queued
            </span>
            <span className="text-xs text-[#6E6E69]">
              · Dual WebP optimization enabled (1000px card + 2560px full)
            </span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full sm:w-auto px-8 py-3 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-md"
            style={{
              background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
              boxShadow:
                '0px 7px 22px rgba(35, 77, 255, 0.13), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
              outline: '2px #2356FF solid',
              borderRadius: 40,
            }}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing artworks...
              </span>
            ) : (
              `Publish ${files.length} Artwork${files.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      )}

      {/* ================================================================== */}
      {/* Section 5 — Processing Modal                                       */}
      {/* ================================================================== */}
      {isProcessing && processingProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 animate-fadeIn border border-[#E8E8E3]">
            {/* Modal Heading */}
            <h2
              className="text-xl sm:text-2xl font-bold text-[#141413] mb-1.5"
              style={{ fontFamily: 'var(--font-century-schoolbook-italic)' }}
            >
              Publishing Artworks
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6E69] mb-6">
              {processingProgress.stage}
            </p>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-[#E8E8E3] rounded-full overflow-hidden mb-6 p-[2px]">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${Math.max(
                    5,
                    Math.round((processingProgress.current / processingProgress.total) * 100)
                  )}%`,
                  background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                }}
              />
            </div>

            {/* Per-File Progress List */}
            <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 scrollbar-none">
              {files.map((f, idx) => {
                const status = fileStatuses[idx] || 'pending';
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 p-2 rounded-xl bg-[#FAF9F7] border border-[#E8E8E3]/60 text-xs sm:text-sm"
                  >
                    {/* Status Icon */}
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      {status === 'done' ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : status === 'error' ? (
                        <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      ) : status === 'compressing' || status === 'uploading' ? (
                        <Loader2 className="w-4 h-4 text-[#1345EE] animate-spin" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#BEBEC7]" />
                      )}
                    </div>

                    {/* Thumbnail */}
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F2F0ED] shrink-0 border border-[#E8E8E3]/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.previewUrl}
                        alt={f.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#141413] truncate">
                        {f.title || f.file.name}
                      </p>
                      <p className="text-[11px] text-[#6E6E69] capitalize">
                        {status === 'compressing'
                          ? 'Dual WebP compression...'
                          : status === 'uploading'
                            ? 'Uploading storage pair...'
                            : status === 'done'
                              ? 'Optimized & uploaded'
                              : status === 'error'
                                ? 'Failed'
                                : 'Waiting in queue'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-[#6E6E69] mt-6 text-center">
              Processing in browser via Canvas & Supabase Storage. Please keep this tab open.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

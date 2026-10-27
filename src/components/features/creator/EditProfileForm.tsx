'use client';

import { useState, useRef, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import {
  Save,
  Eye,
  Upload,
  Camera,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FolderArchive,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  UploadCloud,
} from 'lucide-react';
import { updateProfile, updateProfileAvatar } from '@/actions/profileActions';
import Input from '@/components/ui/Input';
import SingleSelect from '@/components/ui/SingleSelect';
import TextArea from '@/components/ui/TextArea';
import MultiSelect from '@/components/ui/MultiSelect';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

const artFormsOptions = [
  { value: 'Painting', label: 'Painting' },
  { value: 'Drawing', label: 'Drawing & Sketching' },
  { value: 'Sculpture', label: 'Sculpture' },
  { value: 'Photography', label: 'Fine Art Photography' },
  { value: 'Printmaking', label: 'Printmaking' },
  { value: 'Mixed Media', label: 'Mixed Media' },
  { value: 'Illustration', label: 'Illustration' },
  { value: 'Digital Art', label: 'Digital Art' },
  { value: 'Ceramic & Pottery', label: 'Ceramic & Pottery' },
  { value: 'Textile & Fiber Art', label: 'Textile & Fiber Art' },
];

const primaryMediumOptions = [
  { value: 'Oil on Canvas', label: 'Oil on Canvas' },
  { value: 'Acrylic on Canvas', label: 'Acrylic on Canvas' },
  { value: 'Watercolor on Paper', label: 'Watercolor on Paper' },
  { value: 'Gouache on Paper', label: 'Gouache on Paper' },
  { value: 'Ink on Paper', label: 'Ink on Paper' },
  { value: 'Charcoal / Graphite on Paper', label: 'Charcoal / Graphite on Paper' },
  { value: 'Pastel on Paper / Board', label: 'Pastel on Paper / Board' },
  { value: 'Mixed Media', label: 'Mixed Media' },
  { value: 'Bronze Sculpture', label: 'Bronze Sculpture' },
  { value: 'Stone / Marble Sculpture', label: 'Stone / Marble Sculpture' },
  { value: 'Wood Sculpture / Carving', label: 'Wood Sculpture / Carving' },
  { value: 'Ceramic & Clay', label: 'Ceramic & Clay' },
  { value: 'Fine Art Photography', label: 'Fine Art Photography' },
  { value: 'Digital Painting', label: 'Digital Painting' },
  { value: 'Printmaking / Screenprint', label: 'Printmaking / Screenprint' },
  { value: 'Textile / Fiber Art', label: 'Textile / Fiber Art' },
  { value: 'Other Medium', label: 'Other Medium' },
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const editProfileSchema = z.object({
  full_name: z.string().min(2, 'Artist name is required (at least 2 characters)'),
  email: z.string().email().optional(),
  location: z.string().optional(),
  primary_medium: z.string().optional(),
  about_me: z.string().optional(),
  artist_statement: z.string().optional(),
  art_forms: z.array(z.string()).optional(),
  instagram: z.string().optional(),
  awards: z.string().optional(),
  portfolio_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  other_links: z.string().optional(),

  // Dossier fields
  top_artworks_drive_url: z
    .string()
    .url('Please enter a valid URL (e.g. Google Drive link)')
    .or(z.literal(''))
    .optional(),
  custom_proposal_text: z.string().optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

// Clean, spacious Document Uploader Card for 2-Column Grid (PDF Max 10MB)
interface DocumentUploaderProps {
  label: string;
  description?: string;
  required?: boolean;
  docKey: string;
  fileUrl: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
  userId: string;
}

function DocumentUploader({
  label,
  description,
  required,
  docKey,
  fileUrl,
  onUploaded,
  onRemoved,
  userId,
}: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = async (file: File) => {
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setUploadError('Invalid format: Please upload a PDF file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File is too large: Maximum supported size is 10 MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop() || 'pdf';
      const cleanDocKey = docKey.replace(/[^a-zA-Z0-9_-]/g, '_');
      const storagePath = `${userId}/documents/${cleanDocKey}_${Date.now()}.${fileExt}`;

      let bucket = 'creator-documents';
      let uploadResult = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, { upsert: true, contentType: 'application/pdf', cacheControl: '3600' });

      // If creator-documents doesn't exist yet, fallback to avatars bucket
      if (uploadResult.error) {
        bucket = 'avatars';
        uploadResult = await supabase.storage
          .from(bucket)
          .upload(storagePath, file, { upsert: true, contentType: 'application/pdf', cacheControl: '3600' });
      }

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(storagePath);

      onUploaded(publicUrl);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUploadFile(file);
  };

  return (
    <div
      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
      className="space-y-4"
    >
      {/* Spacious Proposal Upload Window - Pure White */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative min-h-[200px] sm:min-h-[220px] rounded-[14px] border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 sm:p-8 text-center cursor-pointer select-none group ${
          isDragging
            ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-500/20'
            : fileUrl
            ? 'border-blue-200 bg-white hover:border-blue-300'
            : 'border-[#D5D5CF] hover:border-[#181A1F] bg-white hover:bg-[#FAFAFA]'
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 size={36} className="animate-spin text-[#181A1F] mb-3" />
            <p className="text-sm font-normal text-[#181A1F]">Uploading proposal...</p>
            <p className="text-xs font-normal text-[#71716D] mt-1">Please wait while your document is being uploaded.</p>
          </div>
        ) : fileUrl ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mb-3 shadow-xs">
              <Check size={22} strokeWidth={2.2} />
            </div>
            <p className="text-sm font-normal text-[#181A1F] flex items-center gap-1.5">
              <span>Proposal Attached & Ready</span>
            </p>
            <p className="text-xs font-normal text-[#71716D] mt-1">
              Click or drag another PDF here to replace this proposal
            </p>
            <div className="flex items-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E8E8E3] hover:border-[#181A1F] text-xs font-normal text-[#181A1F] inline-flex items-center gap-1.5 shadow-2xs hover:bg-[#F8F8F8] transition-colors"
              >
                <ExternalLink size={12} />
                <span>View PDF</span>
              </a>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E8E8E3] hover:border-[#181A1F] text-xs font-normal text-[#181A1F] inline-flex items-center gap-1.5 shadow-2xs hover:bg-[#F8F8F8] transition-colors cursor-pointer"
              >
                <RefreshCw size={11} />
                <span>Replace PDF</span>
              </button>
              <button
                type="button"
                onClick={onRemoved}
                className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E8E8E3] hover:border-red-300 hover:bg-red-50 text-xs font-normal text-[#71716D] hover:text-red-600 inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Remove proposal"
              >
                <Trash2 size={12} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#F8F8F8] border border-[#E2E2DC] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-[#181A1F]">
              <UploadCloud size={24} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-normal text-[#181A1F]">
              Click to choose proposal PDF or drag & drop here
            </p>
            <p className="text-xs font-normal text-[#71716D] mt-1">
              Supported format: PDF only (Maximum file size: 10 MB)
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {uploadError && (
        <div className="pt-1 text-xs text-red-600 flex items-center gap-1.5">
          <AlertCircle size={13} className="shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Title & Description Below the Big Upload Box */}
      <div className="pt-3 border-t border-[#F0F0EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-medium text-[#181A1F] leading-tight flex items-center">
              <span>{label}</span>
              {required && <span className="text-red-500 ml-1 text-xs">*</span>}
            </h3>
            {fileUrl ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-normal text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                <Check size={11} strokeWidth={2.5} className="text-blue-600" />
                <span>Uploaded</span>
              </span>
            ) : (
              <span className="inline-flex items-center text-[11px] font-normal text-[#71716D] bg-[#F3F3F3] px-2 py-0.5 rounded-full">
                Pending upload
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs font-normal text-[#71716D] mt-1 leading-snug">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Document Sliding Window Component (One Div / Window Slider + Uploaded List)
// ---------------------------------------------------------------------------
interface DocumentItem {
  id: string;
  docKey: string;
  label: string;
  shortLabel: string;
  description: string;
  required?: boolean;
  fileUrl: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
}

interface DocumentSlidingWindowProps {
  documents: DocumentItem[];
  userId: string;
}

function DocumentSlidingWindow({ documents, userId }: DocumentSlidingWindowProps) {
  // Default to the first document that has not been uploaded yet, or 0
  const initialIndex = useMemo(() => {
    const firstMissing = documents.findIndex((d) => !d.fileUrl);
    return firstMissing !== -1 ? firstMissing : 0;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [activeDocIndex, setActiveDocIndex] = useState(initialIndex);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const activeDoc = documents[activeDocIndex] || documents[0];

  const handleUploadFile = async (file: File) => {
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setUploadError('Invalid format: Please upload a PDF file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File is too large: Maximum supported size is 10 MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop() || 'pdf';
      const cleanDocKey = activeDoc.docKey.replace(/[^a-zA-Z0-9_-]/g, '_');
      const storagePath = `${userId}/documents/${cleanDocKey}_${Date.now()}.${fileExt}`;

      let bucket = 'creator-documents';
      let uploadResult = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, { upsert: true, contentType: 'application/pdf', cacheControl: '3600' });

      // Fallback to avatars bucket if creator-documents bucket is missing
      if (uploadResult.error) {
        bucket = 'avatars';
        uploadResult = await supabase.storage
          .from(bucket)
          .upload(storagePath, file, { upsert: true, contentType: 'application/pdf', cacheControl: '3600' });
      }

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(storagePath);

      // Save uploaded URL for the active document
      activeDoc.onUploaded(publicUrl);

      // Auto-slide to the next document box!
      const nextMissing = documents.findIndex((d, idx) => idx > activeDocIndex && !d.fileUrl);
      if (nextMissing !== -1) {
        setActiveDocIndex(nextMissing);
      } else {
        const wrapMissing = documents.findIndex((d, idx) => idx !== activeDocIndex && !d.fileUrl);
        if (wrapMissing !== -1) {
          setActiveDocIndex(wrapMissing);
        } else if (activeDocIndex < documents.length - 1) {
          setActiveDocIndex(activeDocIndex + 1);
        }
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  const slidePrev = () => {
    if (activeDocIndex > 0) {
      setActiveDocIndex(activeDocIndex - 1);
      setUploadError(null);
    }
  };

  const slideNext = () => {
    if (activeDocIndex < documents.length - 1) {
      setActiveDocIndex(activeDocIndex + 1);
      setUploadError(null);
    }
  };

  const handleSelectDocument = (index: number) => {
    setActiveDocIndex(index);
    setUploadError(null);
    windowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }} className="space-y-6">
      {/* 1. Main Sliding Window / Div */}
      <div
        ref={windowRef}
        className="bg-white rounded-[16px] border border-[#E8E8E3] p-5 sm:p-6 shadow-2xs space-y-4 transition-all"
      >
        {/* Window Top Bar: Document Pills (Light blue when uploaded) */}
        <div className="border-b border-[#F0F0EB] pb-3.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {documents.map((doc, idx) => {
              const isCurrent = activeDocIndex === idx;
              const isUploaded = Boolean(doc.fileUrl);

              let pillStyle = '';
              if (isUploaded) {
                // Uploaded: turns into light blue
                pillStyle = isCurrent
                  ? 'bg-blue-100 text-blue-900 border-2 border-blue-600 font-normal shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-normal';
              } else if (isCurrent) {
                // Not uploaded, currently active
                pillStyle = 'bg-[#181A1F] text-white shadow-xs font-normal border border-[#181A1F]';
              } else {
                // Not uploaded, inactive
                pillStyle = 'bg-[#F3F3F3] text-[#71716D] hover:bg-[#EAEAEA] hover:text-[#181A1F] border border-transparent font-normal';
              }

              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleSelectDocument(idx)}
                  style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer ${pillStyle}`}
                  title={doc.label}
                >
                  {isUploaded ? (
                    <Check size={12} strokeWidth={2.2} className="text-blue-600 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-black/10 inline-flex items-center justify-center text-[10px] shrink-0 font-normal">
                      {idx + 1}
                    </span>
                  )}
                  <span className="truncate max-w-[110px] sm:max-w-none text-xs">
                    {doc.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Big Upload Box - Pure White, No Cream */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
          className={`relative min-h-[200px] sm:min-h-[220px] rounded-[14px] border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 sm:p-8 text-center cursor-pointer select-none group ${
            isDragging
              ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-500/20'
              : activeDoc.fileUrl
              ? 'border-blue-200 bg-white hover:border-blue-300'
              : 'border-[#D5D5CF] hover:border-[#181A1F] bg-white hover:bg-[#FAFAFA]'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 size={36} className="animate-spin text-[#181A1F] mb-3" />
              <p className="text-sm font-normal text-[#181A1F]">Uploading {activeDoc.label}...</p>
              <p className="text-xs font-normal text-[#71716D] mt-1">Please wait while your document is being uploaded.</p>
            </div>
          ) : activeDoc.fileUrl ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mb-3 shadow-xs">
                <Check size={22} strokeWidth={2.2} />
              </div>
              <p className="text-sm font-normal text-[#181A1F] flex items-center gap-1.5">
                <span>PDF Attached & Ready</span>
              </p>
              <p className="text-xs font-normal text-[#71716D] mt-1">
                Click or drag another PDF here to replace this document
              </p>
              <div className="flex items-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                <a
                  href={activeDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E8E8E3] hover:border-[#181A1F] text-xs font-normal text-[#181A1F] inline-flex items-center gap-1.5 shadow-2xs hover:bg-[#F8F8F8] transition-colors"
                >
                  <ExternalLink size={12} />
                  <span>View PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E8E8E3] hover:border-[#181A1F] text-xs font-normal text-[#181A1F] inline-flex items-center gap-1.5 shadow-2xs hover:bg-[#F8F8F8] transition-colors cursor-pointer"
                >
                  <RefreshCw size={11} />
                  <span>Replace PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => activeDoc.onRemoved()}
                  className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E8E8E3] hover:border-red-300 hover:bg-red-50 text-xs font-normal text-[#71716D] hover:text-red-600 inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Remove document"
                >
                  <Trash2 size={12} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#F8F8F8] border border-[#E2E2DC] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-[#181A1F]">
                <UploadCloud size={24} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-normal text-[#181A1F]">
                Click to choose PDF or drag & drop here
              </p>
              <p className="text-xs font-normal text-[#71716D] mt-1">
                Supported format: PDF only (Maximum file size: 10 MB)
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>

        {uploadError && (
          <div
            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            className="pt-1 text-xs text-red-600 flex items-center gap-1.5"
          >
            <AlertCircle size={13} className="shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* 3. Below the Big Upload Box: Title of the document (Poppins) & Description (Poppins) */}
        <div className="pt-3 border-t border-[#F0F0EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                className="text-sm font-medium text-[#181A1F] leading-tight flex items-center"
              >
                <span>{activeDoc.label}</span>
                {activeDoc.required && <span className="text-red-500 ml-1 text-xs">*</span>}
              </h3>
              {activeDoc.fileUrl ? (
                <span
                  style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                  className="inline-flex items-center gap-1 text-[11px] font-normal text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"
                >
                  <Check size={11} strokeWidth={2.5} className="text-blue-600" />
                  <span>Uploaded</span>
                </span>
              ) : (
                <span
                  style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                  className="inline-flex items-center text-[11px] font-normal text-[#71716D] bg-[#F3F3F3] px-2 py-0.5 rounded-full"
                >
                  Pending upload
                </span>
              )}
            </div>
            <p
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              className="text-xs font-normal text-[#71716D] mt-1 leading-snug"
            >
              {activeDoc.description}
            </p>
          </div>

          {/* Quick Slide Previous / Next Action Buttons (Poppins, Normal weight) */}
          <div
            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            className="flex items-center gap-2 shrink-0"
          >
            <button
              type="button"
              onClick={slidePrev}
              disabled={activeDocIndex === 0}
              className="px-3 py-1.5 rounded-[8px] border border-[#E8E8E3] hover:border-[#181A1F] hover:bg-[#F8F8F8] text-xs font-normal text-[#181A1F] disabled:opacity-35 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={13} />
              <span>Previous</span>
            </button>
            <button
              type="button"
              onClick={slideNext}
              disabled={activeDocIndex === documents.length - 1}
              className="px-3 py-1.5 rounded-[8px] border border-[#E8E8E3] hover:border-[#181A1F] hover:bg-[#F8F8F8] text-xs font-normal text-[#181A1F] disabled:opacity-35 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cleanLocationString(city?: string | null, country?: string | null): string {
  const raw = [city, country].filter(Boolean).join(', ');
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  const uniqueParts: string[] = [];
  for (const part of parts) {
    if (!uniqueParts.some(p => p.toLowerCase() === part.toLowerCase())) {
      uniqueParts.push(part);
    }
  }
  return uniqueParts.join(', ');
}

type CreatorTabKey = 'basic' | 'practice' | 'documents' | 'proposals';

const CREATOR_TABS: {
  key: CreatorTabKey;
  label: string;
}[] = [
  {
    key: 'basic',
    label: 'Basic Information',
  },
  {
    key: 'practice',
    label: 'About & Practice',
  },
  {
    key: 'documents',
    label: 'Documents & Archive',
  },
  {
    key: 'proposals',
    label: 'Project Proposals',
  },
];

export default function EditProfileForm({ userProfile }: { userProfile: Profile }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CreatorTabKey>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile Headshot upload
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.profile_pic_url || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Cover upload
  const [coverPreview, setCoverPreview] = useState<string | null>(userProfile.cover_image_url || null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Dossier File URLs
  const [bioUrl, setBioUrl] = useState<string | null>(userProfile.artist_bio_file_url || null);
  const [cvUrl, setCvUrl] = useState<string | null>(userProfile.cv_file_url || null);
  const [statementUrl, setStatementUrl] = useState<string | null>(userProfile.artist_statement_file_url || null);
  const [shortPortfolioUrl, setShortPortfolioUrl] = useState<string | null>(userProfile.short_portfolio_file_url || null);
  const [longPortfolioUrl, setLongPortfolioUrl] = useState<string | null>(userProfile.long_portfolio_file_url || null);
  const [latestProposalUrl, setLatestProposalUrl] = useState<string | null>(userProfile.latest_proposal_file_url || null);

  // Proposal State ('Yes' | 'No' | 'Other')
  const initialProposalValue = userProfile.has_project_proposals || 'No';
  const isInitialOther = initialProposalValue.startsWith('Other:') || (!['Yes', 'No'].includes(initialProposalValue) && initialProposalValue !== '');
  const [proposalChoice, setProposalChoice] = useState<'Yes' | 'No' | 'Other'>(
    isInitialOther ? 'Other' : (initialProposalValue === 'Yes' ? 'Yes' : 'No')
  );
  const [customProposalText, setCustomProposalText] = useState<string>(
    isInitialOther ? initialProposalValue.replace(/^Other:\s*/, '') : ''
  );

  const resolvedMediumOptions = useMemo(() => {
    if (userProfile.primary_medium && !primaryMediumOptions.some(opt => opt.value === userProfile.primary_medium)) {
      return [{ value: userProfile.primary_medium, label: userProfile.primary_medium }, ...primaryMediumOptions];
    }
    return primaryMediumOptions;
  }, [userProfile.primary_medium]);

  // Dossier 5 Document Definitions for Sliding Window Uploader
  const dossierDocuments: DocumentItem[] = useMemo(() => [
    {
      id: 'artist_biography',
      docKey: 'artist_biography',
      label: 'Artist Biography',
      shortLabel: 'Biography',
      description: '1–2 page narrative of your artistic journey & career milestones.',
      required: true,
      fileUrl: bioUrl,
      onUploaded: setBioUrl,
      onRemoved: () => setBioUrl(null),
    },
    {
      id: 'latest_cv',
      docKey: 'latest_cv',
      label: 'Curriculum Vitae (CV)',
      shortLabel: 'CV',
      description: 'Complete CV detailing exhibitions, education, and grants.',
      required: true,
      fileUrl: cvUrl,
      onUploaded: setCvUrl,
      onRemoved: () => setCvUrl(null),
    },
    {
      id: 'artist_statement',
      docKey: 'artist_statement',
      label: 'Artist Statement',
      shortLabel: 'Statement',
      description: 'Conceptual premise and themes behind your creative practice.',
      required: true,
      fileUrl: statementUrl,
      onUploaded: setStatementUrl,
      onRemoved: () => setStatementUrl(null),
    },
    {
      id: 'short_portfolio',
      docKey: 'short_portfolio',
      label: 'Short Portfolio',
      shortLabel: 'Short Portfolio',
      description: 'Curated preview of 5–10 highlight artworks with details.',
      required: true,
      fileUrl: shortPortfolioUrl,
      onUploaded: setShortPortfolioUrl,
      onRemoved: () => setShortPortfolioUrl(null),
    },
    {
      id: 'long_portfolio',
      docKey: 'long_portfolio',
      label: 'Comprehensive Portfolio',
      shortLabel: 'Full Portfolio',
      description: 'Complete institutional archive of your artistic body of work.',
      required: true,
      fileUrl: longPortfolioUrl,
      onUploaded: setLongPortfolioUrl,
      onRemoved: () => setLongPortfolioUrl(null),
    },
  ], [bioUrl, cvUrl, statementUrl, shortPortfolioUrl, longPortfolioUrl]);

  const initialLocation = useMemo(
    () => cleanLocationString(userProfile.location_city, userProfile.location_country),
    [userProfile.location_city, userProfile.location_country]
  );
  const initialArtForms = useMemo(
    () => (userProfile.art_forms ? userProfile.art_forms.split(',').map((s: string) => s.trim()) : []),
    [userProfile.art_forms]
  );

  const formDefaults = useMemo<EditProfileFormData>(() => ({
    full_name: userProfile.full_name || '',
    email: userProfile.email || '',
    location: initialLocation,
    primary_medium: userProfile.primary_medium || '',
    about_me: userProfile.about_me || '',
    artist_statement: userProfile.artist_statement || '',
    art_forms: initialArtForms,
    instagram: userProfile.social_links?.instagram || '',
    awards: userProfile.awards || '',
    portfolio_url: userProfile.portfolio_url || '',
    other_links: userProfile.other_links || '',
    top_artworks_drive_url: userProfile.top_artworks_drive_url || '',
    custom_proposal_text: isInitialOther ? initialProposalValue.replace(/^Other:\s*/, '') : '',
  }), [userProfile, initialLocation, initialArtForms, isInitialOther, initialProposalValue]);

  const { register, handleSubmit, control, formState: { errors } } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: formDefaults,
    values: formDefaults,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const optimizeAvatarFile = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const htmlImg = document.createElement('img');
      const objectUrl = URL.createObjectURL(file);
      htmlImg.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxDim = 1200;
        let width = htmlImg.naturalWidth || htmlImg.width;
        let height = htmlImg.naturalHeight || htmlImg.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(htmlImg, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          'image/webp',
          0.92
        );
      };
      htmlImg.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      htmlImg.src = objectUrl;
    });
  };

  const uploadImage = async (file: File | Blob, bucket: string, path: string) => {
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true, cacheControl: '3600' });
    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return `${publicUrl}?t=${Date.now()}`;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrorMsg('Please select an image file.'); return; }
    if (file.size > MAX_FILE_SIZE_BYTES) { setErrorMsg('Profile Headshot image must be smaller than 10MB.'); return; }

    setIsUploadingAvatar(true);
    setErrorMsg(null);
    try {
      setAvatarPreview(URL.createObjectURL(file));
      const optimizedBlob = await optimizeAvatarFile(file);
      const uploadPayload = new File([optimizedBlob], 'avatar.webp', { type: 'image/webp' });
      const url = await uploadImage(uploadPayload, 'avatars', `${userProfile.id}/avatar.webp`);
      await updateProfileAvatar(userProfile.id, url);
      setAvatarPreview(url);
      setSuccessMsg('Profile headshot updated!');
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload headshot');
      setAvatarPreview(userProfile.profile_pic_url || null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrorMsg('Please select an image file.'); return; }
    if (file.size > MAX_FILE_SIZE_BYTES) { setErrorMsg('Cover image must be smaller than 10MB.'); return; }

    setIsUploadingCover(true);
    setErrorMsg(null);
    try {
      setCoverPreview(URL.createObjectURL(file));
      const fileExt = file.name.split('.').pop();
      const url = await uploadImage(file, 'avatars', `${userProfile.id}/cover.${fileExt}`);
      await updateProfile({
        userId: userProfile.id,
        full_name: userProfile.full_name,
        cover_image_url: url,
      });
      setCoverPreview(url);
      setSuccessMsg('Cover image updated!');
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload cover');
      setCoverPreview(userProfile.cover_image_url || null);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const onSubmit = async (data: EditProfileFormData) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const rawParts = (data.location || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      const uniqueParts: string[] = [];
      for (const part of rawParts) {
        if (!uniqueParts.some(p => p.toLowerCase() === part.toLowerCase())) {
          uniqueParts.push(part);
        }
      }
      const parsedCity = uniqueParts[0] || null;
      const parsedCountry = uniqueParts.slice(1).join(', ') || null;

      let finalProposal = proposalChoice as string;
      if (proposalChoice === 'Other') {
        finalProposal = customProposalText.trim() ? `Other: ${customProposalText.trim()}` : 'Other';
      }

      await updateProfile({
        userId: userProfile.id,
        full_name: data.full_name,
        about_me: data.about_me,
        location_city: parsedCity,
        location_country: parsedCountry,
        portfolio_url: data.portfolio_url,
        primary_medium: data.primary_medium,
        artist_statement: data.artist_statement,
        art_forms: data.art_forms ? data.art_forms.join(', ') : '',
        awards: data.awards,
        other_links: data.other_links,

        // Dossier fields
        artist_bio_file_url: bioUrl || null,
        cv_file_url: cvUrl || null,
        artist_statement_file_url: statementUrl || null,
        short_portfolio_file_url: shortPortfolioUrl || null,
        long_portfolio_file_url: longPortfolioUrl || null,
        top_artworks_drive_url: data.top_artworks_drive_url || null,
        has_project_proposals: finalProposal,
        latest_proposal_file_url: proposalChoice === 'Yes' ? (latestProposalUrl || null) : null,

        social_links: {
          ...(userProfile.social_links || {}),
          instagram: data.instagram || '',
        },
      });

      setSuccessMsg('Creator profile and documents updated successfully!');
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const watchedValues = useWatch({ control });
  const watchedName = watchedValues.full_name;
  const watchedLocation = watchedValues.location;
  const watchedMedium = watchedValues.primary_medium;
  const watchedAbout = watchedValues.about_me;
  const watchedStatement = watchedValues.artist_statement;
  const watchedDriveUrl = watchedValues.top_artworks_drive_url;

  // Dynamic Dossier Strength calculation with live reactive watch
  const readinessItems = [
    Boolean(watchedName || userProfile.full_name),
    Boolean(avatarPreview),
    Boolean(watchedLocation || userProfile.location_city || userProfile.location_country),
    Boolean(watchedMedium || userProfile.primary_medium),
    Boolean(watchedAbout || watchedStatement || userProfile.about_me || userProfile.artist_statement),
    Boolean(bioUrl),
    Boolean(cvUrl),
    Boolean(statementUrl),
    Boolean(shortPortfolioUrl),
    Boolean(longPortfolioUrl),
    Boolean(watchedDriveUrl || userProfile.top_artworks_drive_url),
  ];
  const completedCount = readinessItems.filter(Boolean).length;
  const readinessScore = Math.round((completedCount / readinessItems.length) * 100);

  return (
    <div
      style={{ fontFamily: "'Poppins', sans-serif" }}
      className="w-full text-[#181A1F] pb-12"
    >
      {/* Notifications */}
      {successMsg && (
        <div className="max-w-5xl mx-auto mb-4 bg-emerald-50 border border-emerald-200 rounded-[14px] p-3.5 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-500 hover:text-emerald-800 text-xs font-semibold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="max-w-5xl mx-auto mb-4 bg-red-50 border border-red-200 rounded-[14px] p-3.5 text-red-800 text-xs sm:text-sm flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-800 text-xs font-semibold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Behance-style Card Container with Minimalist Aesthetic */}
      <div className="max-w-5xl mx-auto bg-white rounded-[24px] border border-[#E8E8E3] shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-[620px]">
          {/* Left Vertical Navigation Sidebar - Clean White Minimalist */}
          <nav className="border-b md:border-b-0 md:border-r border-[#E8E8E3] bg-white flex flex-col justify-between">
            <div>
              {/* 1. Artist Mini Identity Banner */}
              <div className="p-5 border-b border-[#E8E8E3] flex items-center gap-3 bg-white">
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-[#F3F3F3] border border-[#E2E2DC] shrink-0 flex items-center justify-center">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt={userProfile.full_name || 'Artist'}
                      fill
                      sizes="44px"
                      className="object-cover"
                      unoptimized={avatarPreview.startsWith('blob:') || avatarPreview.startsWith('data:')}
                    />
                  ) : (
                    <span className="text-xs font-semibold text-[#6E6E69]">{getInitials(userProfile.full_name)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#181A1F] truncate">{userProfile.full_name || 'Artist'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <p className="text-[10px] text-[#71716D] font-medium">Creator Account</p>
                  </div>
                </div>
              </div>

              {/* 2. Menu Item Buttons (Clean neutral grey, no cream) */}
              <div className="py-2 divide-y divide-[#E8E8E3]/60 bg-white">
                {CREATOR_TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full text-left px-6 py-3.5 transition-colors cursor-pointer block relative focus:outline-none ${
                        isActive
                          ? 'bg-[#F3F3F3] text-[#181A1F] font-semibold border-l-2 border-[#181A1F]'
                          : 'hover:bg-[#F8F8F8] text-[#7A7A78] hover:text-[#181A1F] font-normal border-l-2 border-transparent'
                      }`}
                    >
                      <span className="text-sm block">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 3. Simple Profile Completeness Progress Bar (Clean White) */}
              <div className="p-5 border-t border-[#E8E8E3] bg-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#71716D]">Profile Completeness</span>
                  <span className="font-semibold text-blue-600">{readinessScore}%</span>
                </div>
                <div className="w-full bg-blue-100/70 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${readinessScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#8E8E88]">
                  {completedCount} of {readinessItems.length} dossier requirements filled
                </p>
              </div>


            </div>

            {/* 5. Bottom Trust Badge */}
            <div className="p-5 border-t border-[#E8E8E3] bg-white">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#8E8E88]">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>Verified Creator Portfolio</span>
              </div>
            </div>
          </nav>

          {/* Right Main Content Pane */}
          <main className="p-7 sm:p-10 flex flex-col justify-between">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                {/* TAB 1: BASIC INFORMATION (with Socials & Website) */}
                {activeTab === 'basic' && (
                  <section aria-label="Basic Information" className="space-y-6">
                    {/* Top Row: Avatar on Left + Name & Email on Right */}
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                      {/* Left: Avatar Circle with Camera Icon */}
                      <div className="flex flex-col items-center shrink-0 w-full sm:w-44 pt-1">
                        <div className="relative">
                          <div
                            onClick={() => avatarInputRef.current?.click()}
                            className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-[#F3F3F3] border border-[#E2E2DC] shadow-xs relative flex items-center justify-center cursor-pointer group"
                            title="Click to change profile headshot"
                          >
                            {avatarPreview ? (
                              <Image
                                src={avatarPreview}
                                alt="Profile Headshot"
                                fill
                                sizes="(max-width: 640px) 128px, 144px"
                                className="object-cover group-hover:opacity-90 transition-opacity"
                                unoptimized={avatarPreview.startsWith('blob:') || avatarPreview.startsWith('data:')}
                                priority
                              />
                            ) : (
                              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#8E8E88]">
                                {getInitials(userProfile.full_name)}
                              </span>
                            )}

                            {isUploadingAvatar && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                                <Loader2 size={24} className="text-white animate-spin" />
                              </div>
                            )}
                          </div>

                          {/* Camera Icon Button */}
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                            className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-white border border-[#E2E2DC] hover:border-[#181A1F] hover:bg-[#F8F8F8] text-[#181A1F] shadow-sm flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 z-10"
                            title="Change profile headshot"
                          >
                            <Camera size={14} />
                          </button>
                        </div>

                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </div>

                      {/* Right: Artist Name & Email */}
                      <div className="flex-1 w-full space-y-4">
                        <Input
                          label="Artist Name *"
                          placeholder="Your full professional artist name"
                          error={errors.full_name?.message}
                          {...register('full_name')}
                          defaultValue={userProfile.full_name || ''}
                        />
                        <Input
                          label="Email Address *"
                          placeholder="your@example.com"
                          disabled
                          value={userProfile.email || ''}
                          readOnly
                          className="!bg-[#F8F8F8] hover:!bg-[#F8F8F8] disabled:!bg-[#F8F8F8] disabled:hover:!bg-[#F8F8F8]"
                        />
                      </div>
                    </div>

                    {/* Middle Rows: Location & Primary Medium in 2 columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Location (City, Country)"
                        placeholder="e.g. Mumbai, India"
                        error={errors.location?.message}
                        {...register('location')}
                        defaultValue={initialLocation}
                      />
                      <Controller
                        name="primary_medium"
                        control={control}
                        render={({ field }) => (
                          <SingleSelect
                            label="Primary Medium"
                            placeholder="Select Primary Medium"
                            options={resolvedMediumOptions}
                            value={field.value ?? userProfile.primary_medium ?? ''}
                            onChange={field.onChange}
                            error={errors.primary_medium?.message}
                            searchable
                            clearable
                          />
                        )}
                      />
                    </div>

                    {/* Socials & Web: External Portfolio & Instagram in 2 columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Website / Portfolio URL"
                        placeholder="https://www.yourportfolio.com"
                        error={errors.portfolio_url?.message}
                        {...register('portfolio_url')}
                        defaultValue={userProfile.portfolio_url || ''}
                      />
                      <Input
                        label="Instagram"
                        placeholder="@username"
                        error={errors.instagram?.message}
                        {...register('instagram')}
                        defaultValue={userProfile.social_links?.instagram || ''}
                      />
                    </div>

                    {/* Other Links */}
                    <Input
                      label="Other Relevant Links"
                      placeholder="Press mentions, exhibition links, publications"
                      error={errors.other_links?.message}
                      {...register('other_links')}
                      defaultValue={userProfile.other_links || ''}
                    />

                    {/* Cover Banner Uploader Box */}
                    <div className="bg-white rounded-[16px] border border-[#E8E8E3] p-4 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-16 h-12 rounded-[10px] overflow-hidden border border-[#E8E8E3] bg-white shrink-0 flex items-center justify-center">
                          {coverPreview ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={coverPreview} alt="Cover Banner" className="w-full h-full object-cover" />
                          ) : (
                            <Upload size={16} className="text-[#8E8E88]" />
                          )}
                          {isUploadingCover && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 size={14} className="animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <label className="text-xs font-semibold text-[#181A1F] block">
                            Profile Cover Banner
                          </label>
                          <p className="text-[11px] text-[#71716D] mt-0.5 truncate">
                            Widescreen header · Max 10 MB
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          disabled={isUploadingCover}
                          onClick={() => coverInputRef.current?.click()}
                          className="px-4 py-1.5 rounded-[12px] border border-[#CBCBCB] bg-white hover:bg-[#F3F3F3] text-[#343434] text-xs font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          <Camera size={13} />
                          <span>{coverPreview ? 'Change' : 'Upload'}</span>
                        </button>
                      </div>
                      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    </div>
                  </section>
                )}

                {/* TAB 2: ABOUT & PRACTICE */}
                {activeTab === 'practice' && (
                  <section aria-label="About & Practice" className="space-y-4">
                      <TextArea
                        label="Brief Biography"
                        placeholder="Exploring the quiet relationship between place, memory and everyday life..."
                        error={errors.about_me?.message}
                        {...register('about_me')}
                        defaultValue={userProfile.about_me || ''}
                      />

                      <TextArea
                        label="Artist Statement"
                        placeholder="My practice observes the familiar until it becomes extraordinary..."
                        error={errors.artist_statement?.message}
                        {...register('artist_statement')}
                        defaultValue={userProfile.artist_statement || ''}
                      />

                      <div className="flex flex-col gap-2">
                        <Controller
                          name="art_forms"
                          control={control}
                          render={({ field }) => (
                            <MultiSelect
                              label="Art Forms"
                              options={artFormsOptions}
                              placeholder="Select Art Forms"
                              value={field.value ?? initialArtForms}
                              onChange={field.onChange}
                              error={errors.art_forms?.message}
                            />
                          )}
                        />
                      </div>

                      <Input
                        label="Awards & Honors"
                        placeholder="List major awards, grants, residencies, or career honors"
                        error={errors.awards?.message}
                        {...register('awards')}
                        defaultValue={userProfile.awards || ''}
                      />
                  </section>
                )}

                {/* TAB 3: DOCUMENTS & ARTWORKS ARCHIVE */}
                {activeTab === 'documents' && (
                  <section aria-label="Documents & Archive" className="space-y-6">
                    {/* Section A: Sliding Document Window + Uploaded List with Blue Tick */}
                    <DocumentSlidingWindow
                      documents={dossierDocuments}
                      userId={userProfile.id}
                    />

                    {/* Section B: Top 25 Artworks Archive */}
                    <div className="pt-6 border-t border-[#E8E8E3] space-y-2">
                      <div>
                        <label
                          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                          className="block text-xs font-medium text-[#181A1F] flex items-center gap-1.5 mb-1 select-none"
                        >
                          <FolderArchive size={14} className="text-[#71716D]" />
                          <span>Top 25 Artworks Archive Link</span>
                          <span className="text-red-500 ml-1 text-xs font-normal">*</span>
                        </label>
                        <p
                          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                          className="text-[11px] font-normal text-[#71716D] leading-snug"
                        >
                          Share a Google Drive folder link containing your 25 best artworks, ranked 1 to 25. Please make sure folder access is set to &ldquo;Anyone with the link can view&rdquo;.
                        </p>
                      </div>

                      <Input
                        placeholder="https://drive.google.com/drive/folders/..."
                        error={errors.top_artworks_drive_url?.message}
                        {...register('top_artworks_drive_url')}
                        defaultValue={userProfile.top_artworks_drive_url || ''}
                      />
                    </div>
                  </section>
                )}

                {/* TAB 4: PROJECT PROPOSALS */}
                {activeTab === 'proposals' && (
                  <section aria-label="Project Proposals" className="space-y-6">
                    <div className="bg-white rounded-[16px] border border-[#E8E8E3] p-5 sm:p-6 shadow-2xs space-y-4">
                      <div>
                        <label
                          style={{
                            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                            color: '#181A1F',
                          }}
                          className="text-xs sm:text-sm font-medium block mb-1"
                        >
                          Do you have any ready project proposals? <span className="text-red-500">*</span>
                        </label>
                        <p
                          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                          className="text-[11.5px] text-[#71716D] mb-3 leading-snug"
                        >
                          Let curators and institutional partners know if you currently have ready exhibition concepts, residency proposals, or ongoing project dossiers.
                        </p>

                        {/* Balanced, Proportional Segmented Selector Window */}
                        <div className="inline-grid grid-cols-3 gap-1 bg-[#F3F3F3] p-1 rounded-[10px] border border-[#E2E2DC] w-full sm:w-auto min-w-[280px] sm:min-w-[320px]">
                          <button
                            type="button"
                            onClick={() => setProposalChoice('Yes')}
                            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                            className={`py-2 px-5 sm:px-6 rounded-[8px] text-xs sm:text-[13px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              proposalChoice === 'Yes'
                                ? 'bg-white text-[#181A1F] font-semibold shadow-xs'
                                : 'text-[#6E6E69] hover:text-[#181A1F] font-medium'
                            }`}
                          >
                            <span>Yes</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setProposalChoice('No')}
                            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                            className={`py-2 px-5 sm:px-6 rounded-[8px] text-xs sm:text-[13px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              proposalChoice === 'No'
                                ? 'bg-white text-[#181A1F] font-semibold shadow-xs'
                                : 'text-[#6E6E69] hover:text-[#181A1F] font-medium'
                            }`}
                          >
                            <span>No</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setProposalChoice('Other')}
                            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                            className={`py-2 px-5 sm:px-6 rounded-[8px] text-xs sm:text-[13px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              proposalChoice === 'Other'
                                ? 'bg-white text-[#181A1F] font-semibold shadow-xs'
                                : 'text-[#6E6E69] hover:text-[#181A1F] font-medium'
                            }`}
                          >
                            <span>Other</span>
                          </button>
                        </div>
                      </div>

                      {/* When user selects 'No': Quiet informative confirmation note */}
                      {proposalChoice === 'No' && (
                        <div className="pt-4 border-t border-[#F0F0EB] text-xs text-[#71716D] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                          <span>No active proposal dossier attached. You can upload an exhibition proposal or residency application at any time.</span>
                        </div>
                      )}

                      {/* When user selects 'Other': Generous, spacious TextArea input window */}
                      {proposalChoice === 'Other' && (
                        <div className="pt-4 border-t border-[#E8E8E3] space-y-2">
                          <label
                            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                            className="block text-xs font-medium text-[#181A1F]"
                          >
                            Proposal Overview & Readiness Details <span className="text-red-500">*</span>
                          </label>
                          <TextArea
                            rows={4}
                            placeholder="Describe the upcoming series or concept you are developing, expected timeline, and the types of exhibitions, grants, or residency programs you are seeking..."
                            value={customProposalText}
                            onChange={(e) => setCustomProposalText(e.target.value)}
                            className="w-full text-sm leading-relaxed"
                          />
                          <p
                            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                            className="text-[11px] font-normal text-[#71716D] leading-snug"
                          >
                            Give curators and gallery partners an overview of your upcoming project ideas and current readiness.
                          </p>
                        </div>
                      )}

                      {/* When user selects 'Yes': Spacious, large proposal dropzone window */}
                      {proposalChoice === 'Yes' && (
                        <div className="pt-4 border-t border-[#E8E8E3]">
                          <DocumentUploader
                            label="Project / Residency Proposal"
                            description="Upload your latest exhibition concept, residency application, or upcoming body of work dossier (PDF up to 10 MB)."
                            required
                            docKey="project_proposal"
                            fileUrl={latestProposalUrl}
                            onUploaded={setLatestProposalUrl}
                            onRemoved={() => setLatestProposalUrl(null)}
                            userId={userProfile.id}
                          />
                        </div>
                      )}
                    </div>

                    {/* Curatorial Submission Guidelines (Editorial, Human, Non-AI Layout) */}
                    <div
                      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                      className="bg-white rounded-[16px] border border-[#E8E8E3] p-6 shadow-2xs space-y-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-[#F0F0EB] pb-4">
                        <div>
                          <h3 className="text-sm font-medium text-[#181A1F] tracking-tight">
                            Curatorial Proposal Dossier Guide
                          </h3>
                          <p className="text-xs text-[#71716D] mt-0.5">
                            Recommended structure for exhibitions, institution reviews, and residency applications on Eras.
                          </p>
                        </div>
                        <span className="text-[11px] text-[#8E8E88] shrink-0 font-normal">
                          Format: PDF (3–8 pages recommended)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#8E8E88] font-mono">01</span>
                            <h4 className="text-xs font-medium text-[#181A1F]">Core Conceptual Premise</h4>
                          </div>
                          <p className="text-xs text-[#71716D] leading-relaxed pl-6">
                            State the conceptual inquiry or thematic question driving the new body of work. Focus on research context and intent rather than promotional language.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#8E8E88] font-mono">02</span>
                            <h4 className="text-xs font-medium text-[#181A1F]">Medium, Scale & Installation</h4>
                          </div>
                          <p className="text-xs text-[#71716D] leading-relaxed pl-6">
                            Specify anticipated physical dimensions, materials, wall/floor mounting needs, lighting, or spatial requirements for presentation.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#8E8E88] font-mono">03</span>
                            <h4 className="text-xs font-medium text-[#181A1F]">Production Stage & Timeline</h4>
                          </div>
                          <p className="text-xs text-[#71716D] leading-relaxed pl-6">
                            Clarify if the project is in early research, active production, or near completion, along with estimated dates for shipping or exhibition readiness.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#8E8E88] font-mono">04</span>
                            <h4 className="text-xs font-medium text-[#181A1F]">Visual Documentation & Studies</h4>
                          </div>
                          <p className="text-xs text-[#71716D] leading-relaxed pl-6">
                            Embed clear sketches, material samples, 3D mockups, or related previous works so curators can visualize the physical exhibition in space.
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#F0F0EB] flex items-center gap-2 text-[11px] text-[#71716D]">
                        <span className="font-medium text-[#181A1F]">Editorial Tip:</span>
                        <span>Jurists review dozens of dossiers in one sitting—prioritize clarity, high-resolution visual documentation, and succinct writing.</span>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              {/* Bottom Persistent Action Bar */}
              <div className="mt-8 pt-5 border-t border-[#E8E8E3] flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-[#71716D]">
                  Required fields marked with <span className="text-red-500">*</span>
                </p>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                  {/* Preview Profile Button (Opens in same tab, matching size and radius) */}
                  <Link
                    href={`/artist/${userProfile.id}`}
                    style={{
                      position: 'relative',
                      background: '#181A1F',
                      overflow: 'hidden',
                      borderRadius: 40,
                    }}
                    className="px-8 py-3.5 sm:px-10 sm:py-4 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:bg-black active:scale-[0.98] shadow-md select-none"
                  >
                    <span
                      style={{
                        color: 'white',
                        fontSize: 15,
                        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                        fontWeight: '600',
                        lineHeight: '24px',
                        wordWrap: 'break-word',
                      }}
                      className="flex items-center gap-2 relative z-10"
                    >
                      <Eye size={17} className="text-white" />
                      <span>Preview Profile</span>
                    </span>
                  </Link>

                  {/* Save Profile Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      position: 'relative',
                      background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                      boxShadow: '0px 7px 22px rgba(35, 77, 255, 0.13), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
                      overflow: 'hidden',
                      borderRadius: 40,
                      outline: '2px #2356FF solid',
                      outlineOffset: '-2px',
                    }}
                    className="px-8 py-3.5 sm:px-10 sm:py-4 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group select-none"
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
                        fontSize: 18,
                        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                        fontWeight: '600',
                        lineHeight: '24px',
                        wordWrap: 'break-word',
                      }}
                      className="flex items-center gap-2 relative z-10"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin text-white" />
                          <span>Saving Profile...</span>
                        </>
                      ) : (
                        <>
                          <Save size={18} className="text-white" />
                          <span>Save Profile</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

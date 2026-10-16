'use client';

import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save,
  Upload,
  Camera,
  Loader2,
  X,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FolderArchive,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { updateProfile, updateProfileAvatar } from '@/actions/profileActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import MultiSelect from '@/components/ui/MultiSelect';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const artFormsOptions = [
  { value: 'Painting', label: 'Painting' },
  { value: 'Sculpture', label: 'Sculpture' },
  { value: 'Photography', label: 'Photography' },
  { value: 'Digital Art', label: 'Digital Art' },
  { value: 'Illustration', label: 'Illustration' },
  { value: 'Mixed Media', label: 'Mixed Media' },
  { value: 'Drawing', label: 'Drawing' },
  { value: 'Printmaking', label: 'Printmaking' },
  { value: 'Textile Arts', label: 'Textile Arts' },
  { value: 'Installation', label: 'Installation' },
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

// Compact, elegant Document Uploader Row (PDF Max 10MB)
interface DocumentUploaderProps {
  label: string;
  required?: boolean;
  docKey: string;
  fileUrl: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
  userId: string;
}

function DocumentUploader({
  label,
  required,
  docKey,
  fileUrl,
  onUploaded,
  onRemoved,
  userId,
}: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

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
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`rounded-xl border transition-all p-3.5 bg-white shadow-2xs hover:shadow-xs ${
      fileUrl ? 'border-emerald-200 bg-emerald-50/20' : 'border-[#E8E8E3] hover:border-gray-400'
    }`}>
      <div className="flex items-center justify-between gap-3">
        {/* Left: Icon & Label */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            fileUrl ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-[#FAF9F5] text-gray-500 border border-[#E8E8E3]'
          }`}>
            <FileText size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#141413] truncate">
                {label}
              </span>
              {required && <span className="text-red-500 text-xs">*</span>}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">
              {fileUrl ? 'PDF uploaded · Max 10 MB' : 'PDF · Max 10 MB'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="shrink-0 flex items-center gap-2">
          {isUploading ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium">
              <Loader2 size={12} className="animate-spin" />
              <span>Uploading...</span>
            </div>
          ) : fileUrl ? (
            <div className="flex items-center gap-1">
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mr-1">
                <CheckCircle2 size={11} />
                Uploaded
              </span>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-gray-500 hover:text-[#141413] hover:bg-gray-100 transition-colors"
                title="View document"
              >
                <ExternalLink size={14} />
              </a>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-gray-500 hover:text-[#141413] hover:bg-gray-100 transition-colors cursor-pointer"
                title="Replace document"
              >
                <RefreshCw size={13} />
              </button>
              <button
                type="button"
                onClick={onRemoved}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Remove document"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-full border border-gray-200 bg-[#FAF9F5] hover:bg-[#141413] text-gray-700 hover:text-white hover:border-[#141413] text-xs font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Upload size={12} />
              <span>Choose PDF</span>
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="mt-2 pt-2 border-t border-red-100 text-[11px] text-red-600 flex items-center gap-1.5">
          <AlertCircle size={12} className="shrink-0" />
          <span>{uploadError}</span>
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

export default function EditProfileForm({ userProfile }: { userProfile: any }) {
  const router = useRouter();
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

  const { register, handleSubmit, control, formState: { errors } } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      full_name: userProfile.full_name || '',
      email: userProfile.email || '',
      location: cleanLocationString(userProfile.location_city, userProfile.location_country),
      primary_medium: userProfile.primary_medium || '',
      about_me: userProfile.about_me || '',
      artist_statement: userProfile.artist_statement || '',
      art_forms: userProfile.art_forms ? userProfile.art_forms.split(',').map((s: string) => s.trim()) : [],
      instagram: userProfile.social_links?.instagram || '',
      awards: userProfile.awards || '',
      portfolio_url: userProfile.portfolio_url || '',
      other_links: userProfile.other_links || '',
      top_artworks_drive_url: userProfile.top_artworks_drive_url || '',
      custom_proposal_text: isInitialOther ? initialProposalValue.replace(/^Other:\s*/, '') : '',
    },
  });

  const uploadImage = async (file: File, bucket: string, path: string) => {
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
      const fileExt = file.name.split('.').pop();
      const url = await uploadImage(file, 'avatars', `${userProfile.id}/avatar.${fileExt}`);
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
          instagram: data.instagram || '',
          twitter: '',
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

  return (
    <div className="bg-[var(--color-cor-surface)] rounded-3xl border border-[var(--color-cor-border)] p-6 sm:p-8 max-w-4xl mx-auto shadow-soft-sm">
      {successMsg && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X size={15} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-700 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600">
            <X size={15} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* ========================================================================= */}
        {/* SECTION 1: ARTIST IDENTITY & HEADSHOT (COMPACT & SLEEK)                   */}
        {/* ========================================================================= */}
        <div>
          <div className="border-b border-[#E8E8E3] pb-2.5 mb-5">
            <h2 className="text-lg font-serif font-bold text-[#141413] tracking-tight">
              1. Artist Identity & Headshot
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Your primary public identity details and profile image.
            </p>
          </div>

          {/* Compact Headshot & Cover Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Profile Headshot (Compact) */}
            <div className="bg-white rounded-xl border border-[#E8E8E3] p-3.5 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#E8E8E3] bg-[#FAF9F5] shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Headshot" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-serif font-bold text-gray-400">
                      {getInitials(userProfile.full_name)}
                    </div>
                  )}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 size={14} className="animate-spin text-white" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <label className="text-xs font-semibold text-[#141413] flex items-center gap-1">
                    Profile Headshot <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    Image · Max 10 MB
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-full border border-gray-200 bg-[#FAF9F5] hover:bg-[#141413] text-gray-700 hover:text-white hover:border-[#141413] text-xs font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <Camera size={12} />
                  <span>{avatarPreview ? 'Change' : 'Upload'}</span>
                </button>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            {/* Profile Cover Banner (Compact) */}
            <div className="bg-white rounded-xl border border-[#E8E8E3] p-3.5 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-14 h-12 rounded-lg overflow-hidden border border-[#E8E8E3] bg-[#FAF9F5] shrink-0 flex items-center justify-center">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={16} className="text-gray-400" />
                  )}
                  {isUploadingCover && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 size={14} className="animate-spin text-white" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <label className="text-xs font-semibold text-[#141413]">
                    Cover Banner
                  </label>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    Widescreen header · Max 10 MB
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  disabled={isUploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-full border border-gray-200 bg-[#FAF9F5] hover:bg-[#141413] text-gray-700 hover:text-white hover:border-[#141413] text-xs font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <Upload size={12} />
                  <span>{coverPreview ? 'Change' : 'Upload'}</span>
                </button>
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Artist Name *"
              placeholder="Your full professional artist name"
              error={errors.full_name?.message}
              {...register('full_name')}
            />
            <Input
              label="Email Address *"
              placeholder="your@example.com"
              disabled
              {...register('email')}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: ARTIST DOSSIER & REQUIRED DOCUMENTS (COMPACT ROWS)             */}
        {/* ========================================================================= */}
        <div>
          <div className="border-b border-[#E8E8E3] pb-2.5 mb-4">
            <h2 className="text-lg font-serif font-bold text-[#141413] tracking-tight">
              2. Documents
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload each required document in PDF format (Max 10 MB each).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <DocumentUploader
              label="Upload your Artist Biography"
              required
              docKey="artist_biography"
              fileUrl={bioUrl}
              onUploaded={setBioUrl}
              onRemoved={() => setBioUrl(null)}
              userId={userProfile.id}
            />

            <DocumentUploader
              label="Upload your latest CV"
              required
              docKey="latest_cv"
              fileUrl={cvUrl}
              onUploaded={setCvUrl}
              onRemoved={() => setCvUrl(null)}
              userId={userProfile.id}
            />

            <DocumentUploader
              label="Upload your Artist Statement"
              required
              docKey="artist_statement"
              fileUrl={statementUrl}
              onUploaded={setStatementUrl}
              onRemoved={() => setStatementUrl(null)}
              userId={userProfile.id}
            />

            <DocumentUploader
              label="Upload your short portfolio"
              required
              docKey="short_portfolio"
              fileUrl={shortPortfolioUrl}
              onUploaded={setShortPortfolioUrl}
              onRemoved={() => setShortPortfolioUrl(null)}
              userId={userProfile.id}
            />

            <div className="md:col-span-2">
              <DocumentUploader
                label="Upload your long portfolio"
                required
                docKey="long_portfolio"
                fileUrl={longPortfolioUrl}
                onUploaded={setLongPortfolioUrl}
                onRemoved={() => setLongPortfolioUrl(null)}
                userId={userProfile.id}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: TOP 25 ARTWORKS GOOGLE DRIVE FOLDER (COMPACT & CLEAN)          */}
        {/* ========================================================================= */}
        <div>
          <div className="border-b border-[#E8E8E3] pb-2.5 mb-4">
            <h2 className="text-lg font-serif font-bold text-[#141413] tracking-tight">
              3. Top 25 Artworks Archive
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Curated ranking folder link for exhibition curation, cataloging, and institutional reviews.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#E8E8E3] p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#141413] text-[#FAF5EC] flex items-center justify-center shrink-0 mt-0.5">
                <FolderArchive size={16} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#141413]">
                  Upload Link (Your top 25 Artworks) <span className="text-red-500">*</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Please create a Google Drive folder containing your 25 best artworks and share the folder link below.
                </p>
              </div>
            </div>

            {/* Instruction Callout Box */}
            <div className="bg-[#FAF9F5] border border-[#E8E8E3] rounded-lg p-3 text-[11px] text-gray-700 space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#141413] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <span className="font-semibold text-[#141413]">
                    Arrange/rank your artworks from 1-25 (1 = Best/strongest, 2 = Second best, up to 25).
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#141413] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  When adding new artwork in the future, please upload it to the same folder with the appropriate ranking.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#141413] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Please ensure that Eras has access to the folder. Keep the artwork images high-resolution and clearly labelled.
                </p>
              </div>
            </div>

            <Input
              label="Google Drive Folder Link *"
              placeholder="https://drive.google.com/drive/folders/..."
              error={errors.top_artworks_drive_url?.message}
              {...register('top_artworks_drive_url')}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: PROJECT PROPOSALS (COMPACT)                                    */}
        {/* ========================================================================= */}
        <div>
          <div className="border-b border-[#E8E8E3] pb-2.5 mb-4">
            <h2 className="text-lg font-serif font-bold text-[#141413] tracking-tight">
              4. Project Proposals
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Let us know if you have any ready project or residency proposals available.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#E8E8E3] p-4 sm:p-5 shadow-2xs space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#141413] block mb-2.5">
                Do you have any ready project proposals? <span className="text-red-500">*</span>
              </label>

              <div className="flex flex-wrap items-center gap-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#141413]">
                  <input
                    type="radio"
                    name="proposal_radio"
                    value="Yes"
                    checked={proposalChoice === 'Yes'}
                    onChange={() => setProposalChoice('Yes')}
                    className="w-3.5 h-3.5 accent-[#141413] cursor-pointer"
                  />
                  <span className="font-medium">Yes</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#141413]">
                  <input
                    type="radio"
                    name="proposal_radio"
                    value="No"
                    checked={proposalChoice === 'No'}
                    onChange={() => setProposalChoice('No')}
                    className="w-3.5 h-3.5 accent-[#141413] cursor-pointer"
                  />
                  <span className="font-medium">No</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#141413]">
                  <input
                    type="radio"
                    name="proposal_radio"
                    value="Other"
                    checked={proposalChoice === 'Other'}
                    onChange={() => setProposalChoice('Other')}
                    className="w-3.5 h-3.5 accent-[#141413] cursor-pointer"
                  />
                  <span className="font-medium">Other:</span>
                </label>
              </div>

              {proposalChoice === 'Other' && (
                <div className="mt-2.5 max-w-md">
                  <Input
                    placeholder="Specify proposal details or readiness..."
                    value={customProposalText}
                    onChange={(e) => setCustomProposalText(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Conditional Proposal PDF Upload (Compact) */}
            {proposalChoice === 'Yes' && (
              <div className="pt-3 border-t border-[#E8E8E3]">
                <DocumentUploader
                  label="If yes, please upload your latest proposal below"
                  required
                  docKey="project_proposal"
                  fileUrl={latestProposalUrl}
                  onUploaded={setLatestProposalUrl}
                  onRemoved={() => setLatestProposalUrl(null)}
                  userId={userProfile.id}
                />
                <p className="text-[10px] text-gray-400 mt-1.5 italic">
                  (This may include project proposal, residency proposal, or other completed project document.)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: PRACTICE, MEDIUMS & ONLINE PRESENCE                           */}
        {/* ========================================================================= */}
        <div>
          <div className="border-b border-[#E8E8E3] pb-2.5 mb-4">
            <h2 className="text-lg font-serif font-bold text-[#141413] tracking-tight">
              5. Practice, Mediums & Social Presence
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Additional context, mediums, and external channels for your public profile.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Location (City, Country)"
                placeholder="e.g. Mumbai, India"
                error={errors.location?.message}
                {...register('location')}
              />
              <Input
                label="Primary Medium"
                placeholder="e.g. Oil on Canvas, Bronze Sculpture"
                error={errors.primary_medium?.message}
                {...register('primary_medium')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextArea
                label="Brief Biography"
                placeholder="Exploring the quiet relationship between place, memory and everyday life..."
                error={errors.about_me?.message}
                {...register('about_me')}
              />
              <TextArea
                label="Artist Statement"
                placeholder="My practice observes the familiar until it becomes extraordinary..."
                error={errors.artist_statement?.message}
                {...register('artist_statement')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Controller
                  name="art_forms"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      label="Art Forms"
                      options={artFormsOptions}
                      placeholder="Select Art Forms"
                      value={field.value || []}
                      onChange={field.onChange}
                      error={errors.art_forms?.message}
                    />
                  )}
                />
              </div>
              <Input
                label="Instagram"
                placeholder="@username"
                error={errors.instagram?.message}
                {...register('instagram')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Awards & Honors"
                placeholder="List major awards or grants"
                error={errors.awards?.message}
                {...register('awards')}
              />
              <Input
                label="External Portfolio Link"
                placeholder="https://..."
                error={errors.portfolio_url?.message}
                {...register('portfolio_url')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Other Relevant Links"
                placeholder="Press, catalogue, article links"
                error={errors.other_links?.message}
                {...register('other_links')}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-[#E8E8E3]">
          <p className="text-xs text-gray-500">
            Make sure all required fields marked with <span className="text-red-500">*</span> are complete before saving.
          </p>
          <Button type="submit" isLoading={isLoading} variant="primary">
            <Save size={15} />
            Save Profile & Documents
          </Button>
        </div>
      </form>
    </div>
  );
}

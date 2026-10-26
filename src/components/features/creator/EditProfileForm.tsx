'use client';

import { useState, useRef, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  Save,
  Upload,
  Camera,
  Loader2,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FolderArchive,
  Trash2,
  RefreshCw,
  Cloud,
  Sparkles,
} from 'lucide-react';
import { updateProfile, updateProfileAvatar } from '@/actions/profileActions';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
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
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      style={{ fontFamily: "'Poppins', sans-serif" }}
      className={`rounded-[14px] border transition-all p-3.5 sm:p-4 bg-white flex flex-col justify-between shadow-2xs hover:shadow-xs ${
        fileUrl ? 'border-emerald-200 bg-emerald-50/15' : 'border-[#E8E8E3] hover:border-[#181A1F]'
      }`}
    >
      {/* Top Section: Icon, Title with Red Star & Description */}
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5 ${
          fileUrl ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-[#F8F8F8] text-[#181A1F] border border-[#E8E8E3]'
        }`}>
          <FileText size={15} />
        </div>

        <div className="min-w-0 flex-1">
          <label
            style={{
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              color: '#181A1F',
              fontWeight: 500,
            }}
            className="text-xs font-medium text-[#181A1F] leading-tight flex items-center mb-1 select-none"
          >
            <span>{label}</span>
            {required && <span className="text-red-500 ml-1 text-xs font-normal">*</span>}
          </label>
          {description && (
            <p
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              className="text-[11px] text-[#71716D] leading-snug line-clamp-1"
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Section: File Info & Actions */}
      <div className="mt-3 pt-2.5 border-t border-[#F0F0EB] flex items-center justify-between gap-2 flex-wrap">
        <span
          style={{ fontFamily: "'Poppins', sans-serif" }}
          className="text-[10.5px] text-[#929292]"
        >
          {fileUrl ? 'PDF attached · Max 10 MB' : 'PDF · Max 10 MB'}
        </span>

        <div>
          {isUploading ? (
            <div
              style={{ fontFamily: "'Poppins', sans-serif" }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#F3F3F3] text-[#71716D] text-[11px] font-medium"
            >
              <Loader2 size={11} className="animate-spin text-[#181A1F]" />
              <span>Uploading...</span>
            </div>
          ) : fileUrl ? (
            <div className="flex items-center gap-1">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: "'Poppins', sans-serif" }}
                className="px-2 py-1 rounded-[6px] text-[11px] font-medium text-[#181A1F] bg-[#F3F3F3] hover:bg-[#E8E8E8] transition-colors inline-flex items-center gap-1"
                title="View document"
              >
                <ExternalLink size={11} />
                <span>View</span>
              </a>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ fontFamily: "'Poppins', sans-serif" }}
                className="px-2 py-1 rounded-[6px] text-[11px] font-medium text-[#181A1F] bg-[#F3F3F3] hover:bg-[#E8E8E8] transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Replace document"
              >
                <RefreshCw size={10} />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={onRemoved}
                style={{ fontFamily: "'Poppins', sans-serif" }}
                className="p-1 rounded-[6px] text-[#8E8E88] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Remove document"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontFamily: "'Poppins', sans-serif" }}
              className="px-3 py-1 rounded-[7px] border border-[#E2E2DC] bg-[#F8F8F8] hover:bg-[#181A1F] text-[#181A1F] hover:text-white hover:border-[#181A1F] text-[11px] font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Upload size={11} />
              <span>Choose PDF</span>
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <div
          style={{ fontFamily: "'Poppins', sans-serif" }}
          className="mt-2 pt-1.5 border-t border-red-100 text-xs text-red-600 flex items-center gap-1.5"
        >
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
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#F3F3F3] border border-[#E2E2DC] shrink-0 flex items-center justify-center">
                  {avatarPreview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={avatarPreview} alt={userProfile.full_name} className="w-full h-full object-cover" />
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
                  <span className="font-semibold text-[#181A1F]">{readinessScore}%</span>
                </div>
                <div className="w-full bg-[#EFEFEF] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#181A1F] h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${readinessScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#8E8E88]">
                  {completedCount} of {readinessItems.length} dossier requirements filled
                </p>
              </div>

              {/* 4. Curatorial Indexing Note */}
              <div className="p-5 border-t border-[#E8E8E3]">
                <div className="bg-[#F8F8F8] rounded-[16px] border border-[#E8E8E3] p-3.5 text-[11px] text-[#555555] space-y-1.5">
                  <p className="font-semibold text-[#181A1F] flex items-center gap-1.5">
                    <Sparkles size={12} className="text-[#181A1F]" />
                    <span>Curatorial Indexing</span>
                  </p>
                  <p className="text-[#71716D] leading-relaxed text-[10.5px]">
                    All saved profile sections and dossier files are synchronized for curatorial reviews and patron discovery.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Bottom Actions & Trust Badge */}
            <div className="p-5 border-t border-[#E8E8E3] bg-white space-y-2.5">
              <Link
                href={`/artist/${userProfile.id}`}
                target="_blank"
                style={{
                  background: '#F3F3F3',
                  borderRadius: 12,
                  fontFamily: "'Poppins', sans-serif",
                  color: '#343434',
                  fontWeight: 500,
                }}
                className="w-full py-2.5 px-3 hover:bg-[#EAEAEA] text-xs flex items-center justify-center gap-2 transition-all group"
              >
                <span>Preview Public Page</span>
                <ExternalLink size={12} className="text-[#71716D] group-hover:text-[#181A1F]" />
              </Link>

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
                      {/* Left: Avatar Circle + Replace Link */}
                      <div className="flex flex-col items-center shrink-0 w-full sm:w-36 pt-1">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#F3F3F3] border border-[#E2E2DC] shadow-xs relative flex items-center justify-center">
                          {avatarPreview ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={avatarPreview}
                              alt="Profile Headshot"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl sm:text-2xl font-serif font-bold text-[#8E8E88]">
                              {getInitials(userProfile.full_name)}
                            </span>
                          )}

                          {isUploadingAvatar && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 size={24} className="text-white animate-spin" />
                            </div>
                          )}
                        </div>

                        {/* Replace Link with Cloud Icon */}
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="mt-3 text-xs font-medium text-[#181A1F] hover:text-black hover:underline transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Cloud size={14} className="text-[#181A1F]" />
                          <span>Replace</span>
                        </button>

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
                        />
                        <Input
                          label="Email Address *"
                          placeholder="your@example.com"
                          disabled
                          {...register('email')}
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
                      />
                      <Controller
                        name="primary_medium"
                        control={control}
                        render={({ field }) => (
                          <SingleSelect
                            label="Primary Medium"
                            placeholder="Select Primary Medium"
                            options={resolvedMediumOptions}
                            value={field.value || ''}
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
                      />
                      <Input
                        label="Instagram"
                        placeholder="@username"
                        error={errors.instagram?.message}
                        {...register('instagram')}
                      />
                    </div>

                    {/* Other Links */}
                    <Input
                      label="Other Relevant Links"
                      placeholder="Press mentions, exhibition links, publications"
                      error={errors.other_links?.message}
                      {...register('other_links')}
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
                      />

                      <TextArea
                        label="Artist Statement"
                        placeholder="My practice observes the familiar until it becomes extraordinary..."
                        error={errors.artist_statement?.message}
                        {...register('artist_statement')}
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
                              value={field.value || []}
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
                      />
                  </section>
                )}

                {/* TAB 3: DOCUMENTS & ARTWORKS ARCHIVE */}
                {activeTab === 'documents' && (
                  <section aria-label="Documents & Archive" className="space-y-6">
                    {/* Section A: Institutional Documents Grid - 2 columns (2 boxes per row) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
                      <DocumentUploader
                        label="Artist Biography"
                        description="1–2 page narrative of your artistic journey & career milestones."
                        required
                        docKey="artist_biography"
                        fileUrl={bioUrl}
                        onUploaded={setBioUrl}
                        onRemoved={() => setBioUrl(null)}
                        userId={userProfile.id}
                      />

                      <DocumentUploader
                        label="Curriculum Vitae (CV)"
                        description="Complete CV detailing exhibitions, education, and grants."
                        required
                        docKey="latest_cv"
                        fileUrl={cvUrl}
                        onUploaded={setCvUrl}
                        onRemoved={() => setCvUrl(null)}
                        userId={userProfile.id}
                      />

                      <DocumentUploader
                        label="Artist Statement"
                        description="Conceptual premise and themes behind your creative practice."
                        required
                        docKey="artist_statement"
                        fileUrl={statementUrl}
                        onUploaded={setStatementUrl}
                        onRemoved={() => setStatementUrl(null)}
                        userId={userProfile.id}
                      />

                      <DocumentUploader
                        label="Short Portfolio"
                        description="Curated preview of 5–10 highlight artworks with details."
                        required
                        docKey="short_portfolio"
                        fileUrl={shortPortfolioUrl}
                        onUploaded={setShortPortfolioUrl}
                        onRemoved={() => setShortPortfolioUrl(null)}
                        userId={userProfile.id}
                      />

                      <DocumentUploader
                        label="Comprehensive Portfolio"
                        description="Complete institutional archive of your artistic body of work."
                        required
                        docKey="long_portfolio"
                        fileUrl={longPortfolioUrl}
                        onUploaded={setLongPortfolioUrl}
                        onRemoved={() => setLongPortfolioUrl(null)}
                        userId={userProfile.id}
                      />
                    </div>

                    {/* Section B: Top 25 Artworks Archive */}
                    <div className="pt-6 border-t border-[#E8E8E3] space-y-2">
                      <div>
                        <label
                          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif", fontWeight: 500 }}
                          className="block text-xs font-medium text-[#181A1F] flex items-center gap-1.5 mb-1 select-none"
                        >
                          <FolderArchive size={14} className="text-[#71716D]" />
                          <span>Top 25 Artworks Archive Link</span>
                          <span className="text-red-500 ml-1 text-xs font-normal">*</span>
                        </label>
                        <p
                          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                          className="text-[11px] text-[#71716D] leading-snug"
                        >
                          Share a Google Drive folder link containing your 25 best artworks, ranked 1 to 25. Please make sure folder access is set to &ldquo;Anyone with the link can view&rdquo;.
                        </p>
                      </div>

                      <Input
                        placeholder="https://drive.google.com/drive/folders/..."
                        error={errors.top_artworks_drive_url?.message}
                        {...register('top_artworks_drive_url')}
                      />
                    </div>
                  </section>
                )}

                {/* TAB 4: PROJECT PROPOSALS */}
                {activeTab === 'proposals' && (
                  <section aria-label="Project Proposals" className="space-y-6">
                    <div className="bg-white rounded-[16px] border border-[#E8E8E3] p-5 shadow-2xs space-y-4">
                      <div>
                        <label
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            color: '#929292',
                            fontWeight: 500,
                          }}
                          className="text-xs block mb-2.5"
                        >
                          Do you have any ready project proposals? <span className="text-red-500">*</span>
                        </label>

                        {/* Segmented Pill Selector matching Login/Signup "Pick a side" */}
                        <div className="inline-flex items-center bg-[#F3F3F3] p-1 rounded-[10px] border border-gray-200/50">
                          <button
                            type="button"
                            onClick={() => setProposalChoice('Yes')}
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                            className={`px-4 py-1.5 rounded-[7px] text-xs transition-all cursor-pointer ${
                              proposalChoice === 'Yes'
                                ? 'bg-white text-gray-900 font-semibold shadow-xs'
                                : 'text-[#6E6E69] hover:text-gray-900 font-medium'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setProposalChoice('No')}
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                            className={`px-4 py-1.5 rounded-[7px] text-xs transition-all cursor-pointer ${
                              proposalChoice === 'No'
                                ? 'bg-white text-gray-900 font-semibold shadow-xs'
                                : 'text-[#6E6E69] hover:text-gray-900 font-medium'
                            }`}
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => setProposalChoice('Other')}
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                            className={`px-4 py-1.5 rounded-[7px] text-xs transition-all cursor-pointer ${
                              proposalChoice === 'Other'
                                ? 'bg-white text-gray-900 font-semibold shadow-xs'
                                : 'text-[#6E6E69] hover:text-gray-900 font-medium'
                            }`}
                          >
                            Other
                          </button>
                        </div>

                        {proposalChoice === 'Other' && (
                          <div className="mt-3 max-w-md">
                            <Input
                              placeholder="Specify proposal details or readiness..."
                              value={customProposalText}
                              onChange={(e) => setCustomProposalText(e.target.value)}
                            />
                          </div>
                        )}
                      </div>

                      {/* Conditional Proposal PDF Upload */}
                      {proposalChoice === 'Yes' && (
                        <div className="pt-3 border-t border-[#E8E8E3]">
                          <DocumentUploader
                            label="Project / Residency Proposal"
                            description="Upload your latest project proposal, residency application, or exhibition concept dossier (PDF)."
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

                    {/* Proposal Guidelines & Review Criteria Card to fill space purposefully */}
                    <div className="bg-white rounded-[16px] border border-[#E8E8E3] p-5 shadow-2xs space-y-3">
                      <div
                        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif", fontWeight: 500 }}
                        className="text-xs font-medium text-[#181A1F] flex items-center gap-1.5"
                      >
                        <Sparkles size={14} className="text-[#71716D]" />
                        <span>Curatorial Proposal Guidelines</span>
                      </div>
                      <p className="text-[11px] text-[#555555] leading-relaxed">
                        Curators, galleries, and residency boards frequently search for actionable artist proposals. When preparing your proposal document, we recommend including:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="bg-white rounded-[12px] border border-[#E8E8E3] p-3 text-[11px]">
                          <p className="font-semibold text-[#181A1F]">Concept & Scope</p>
                          <p className="text-[#71716D] mt-0.5">Conceptual foundation, thematic intent, and visual research.</p>
                        </div>
                        <div className="bg-white rounded-[12px] border border-[#E8E8E3] p-3 text-[11px]">
                          <p className="font-semibold text-[#181A1F]">Materials & Specs</p>
                          <p className="text-[#71716D] mt-0.5">Physical dimensions, mediums, framing, and installation needs.</p>
                        </div>
                        <div className="bg-white rounded-[12px] border border-[#E8E8E3] p-3 text-[11px]">
                          <p className="font-semibold text-[#181A1F]">Timeline & Readiness</p>
                          <p className="text-[#71716D] mt-0.5">Production timeline, budget outline, and exhibition availability.</p>
                        </div>
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
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      background: '#181A1F',
                      borderRadius: 16.22,
                      fontFamily: "'Poppins', sans-serif",
                      color: 'white',
                      fontWeight: 600,
                    }}
                    className="px-7 py-3 hover:bg-black active:scale-[0.99] text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving Profile...</span>
                      </>
                    ) : (
                      <>
                        <Save size={15} />
                        <span>Save Profile</span>
                      </>
                    )}
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

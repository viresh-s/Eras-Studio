'use client';

import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Upload, Camera, Loader2, X } from 'lucide-react';
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

const editProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email().optional(),
  location: z.string().optional(),
  primary_medium: z.string().optional(),
  about_me: z.string().optional(),
  artist_statement: z.string().optional(),
  art_forms: z.array(z.string()).optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  awards: z.string().optional(),
  portfolio_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  other_links: z.string().optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

export default function EditProfileForm({ userProfile }: { userProfile: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Avatar upload
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.profile_pic_url || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Cover upload
  const [coverPreview, setCoverPreview] = useState<string | null>(userProfile.cover_image_url || null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, control, formState: { errors } } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      full_name: userProfile.full_name || '',
      email: userProfile.email || '',
      location: [userProfile.location_city, userProfile.location_country].filter(Boolean).join(', ') || '',
      primary_medium: userProfile.primary_medium || '',
      about_me: userProfile.about_me || '',
      artist_statement: userProfile.artist_statement || '',
      art_forms: userProfile.art_forms ? userProfile.art_forms.split(',').map((s: string) => s.trim()) : [],
      website: userProfile.social_links?.website || '',
      instagram: userProfile.social_links?.instagram || '',
      awards: userProfile.awards || '',
      portfolio_url: userProfile.portfolio_url || '',
      other_links: userProfile.other_links || '',
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
    if (file.size > 2 * 1024 * 1024) { setErrorMsg('Image must be smaller than 2MB.'); return; }

    setIsUploadingAvatar(true);
    setErrorMsg(null);
    try {
      setAvatarPreview(URL.createObjectURL(file));
      const fileExt = file.name.split('.').pop();
      const url = await uploadImage(file, 'avatars', `${userProfile.id}/avatar.${fileExt}`);
      await updateProfileAvatar(userProfile.id, url);
      setAvatarPreview(url);
      setSuccessMsg('Profile picture updated!');
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload image');
      setAvatarPreview(userProfile.profile_pic_url || null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrorMsg('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setErrorMsg('Cover image must be smaller than 5MB.'); return; }

    setIsUploadingCover(true);
    setErrorMsg(null);
    try {
      setCoverPreview(URL.createObjectURL(file));
      const fileExt = file.name.split('.').pop();
      const url = await uploadImage(file, 'avatars', `${userProfile.id}/cover.${fileExt}`);
      // Save cover URL to profile
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
      // Parse location into city/country
      const locationParts = (data.location || '').split(',').map((s: string) => s.trim());

      await updateProfile({
        userId: userProfile.id,
        full_name: data.full_name,
        about_me: data.about_me,
        location_city: locationParts[0] || null,
        location_country: locationParts[1] || null,
        portfolio_url: data.portfolio_url,
        primary_medium: data.primary_medium,
        artist_statement: data.artist_statement,
        art_forms: data.art_forms ? data.art_forms.join(', ') : '',
        awards: data.awards,
        other_links: data.other_links,
        social_links: {
          instagram: data.instagram || '',
          twitter: '',
          website: data.website || '',
        },
      });
      setSuccessMsg('Profile updated successfully!');
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-cor-surface)] rounded-3xl border border-[var(--color-cor-border)] p-8">
      {successMsg && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm flex items-center justify-between">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-700"><X size={16} /></button>
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm flex items-center justify-between">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
        </div>
      )}

      {/* Profile Image + Cover Image Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Profile Image */}
        <div
          className="border-2 border-dashed border-[var(--color-cor-border)] rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4F4ED] transition-colors relative overflow-hidden"
          onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
        >
          {avatarPreview ? (
            <div className="w-20 h-20 rounded-full overflow-hidden mb-3">
              <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#F4F4ED] flex items-center justify-center mb-3 text-xl font-bold text-[var(--color-cor-ink-light)]">
              {getInitials(userProfile.full_name)}
            </div>
          )}
          {isUploadingAvatar ? (
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-cor-ink-light)] mb-2" />
          ) : (
            <Upload className="w-5 h-5 text-[var(--color-cor-ink-light)] mb-2" />
          )}
          <p className="text-sm font-semibold text-[var(--color-cor-ink)]">Profile Image</p>
          <p className="text-xs text-[var(--color-cor-ink-light)] mt-0.5">Choose file, drag & drop or Paste</p>
          <p className="text-xs text-[var(--color-cor-ink-light)]">Choose File · No file chosen</p>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        {/* Cover Image */}
        <div
          className="border-2 border-dashed border-[var(--color-cor-border)] rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4F4ED] transition-colors relative overflow-hidden"
          onClick={() => !isUploadingCover && coverInputRef.current?.click()}
        >
          {coverPreview ? (
            <div className="w-full h-20 rounded-lg overflow-hidden mb-3">
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-xl bg-[#F4F4ED] flex items-center justify-center mb-3">
              <Camera className="w-8 h-8 text-[var(--color-cor-ink-light)]" />
            </div>
          )}
          {isUploadingCover ? (
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-cor-ink-light)] mb-2" />
          ) : (
            <Upload className="w-5 h-5 text-[var(--color-cor-ink-light)] mb-2" />
          )}
          <p className="text-sm font-semibold text-[var(--color-cor-ink)]">Cover Image</p>
          <p className="text-xs text-[var(--color-cor-ink-light)] mt-0.5">Choose file, drag & drop or Paste</p>
          <p className="text-xs text-[var(--color-cor-ink-light)]">Choose File · No file chosen</p>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Full Name *" placeholder="Your name" error={errors.full_name?.message} {...register('full_name')} />
          <Input label="Email *" placeholder="your@example.com" disabled {...register('email')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Location" placeholder="Mumbai" error={errors.location?.message} {...register('location')} />
          <Input label="Primary Medium" placeholder="Painting" error={errors.primary_medium?.message} {...register('primary_medium')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <TextArea label="Biography" placeholder="Exploring the quiet relationship between place, memory and everyday life." error={errors.about_me?.message} {...register('about_me')} />
          <TextArea label="Artist Statement" placeholder="My practice observes the familiar until it becomes extraordinary..." error={errors.artist_statement?.message} {...register('artist_statement')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          <Input label="Website" placeholder="https://..." error={errors.website?.message} {...register('website')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Instagram" placeholder="@username" error={errors.instagram?.message} {...register('instagram')} />
          <Input label="Awards" placeholder="Awards & recognitions" error={errors.awards?.message} {...register('awards')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Portfolio URL" placeholder="https://..." error={errors.portfolio_url?.message} {...register('portfolio_url')} />
          <Input label="Other Links" placeholder="Additional links" error={errors.other_links?.message} {...register('other_links')} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-cor-border-light)]">
          <Button type="submit" isLoading={isLoading} variant="primary">
            <Save size={16} />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

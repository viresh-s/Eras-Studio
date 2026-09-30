'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, User, MapPin, Link as LinkIcon, AtSign, Globe, Camera, Loader2 } from 'lucide-react';
import { updateProfile, updateProfileAvatar } from '@/actions/profileActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const settingsSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  about_me: z.string().optional(),
  location_city: z.string().optional(),
  location_country: z.string().optional(),
  portfolio_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function CreatorSettingsForm({ userProfile }: { userProfile: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.profile_pic_url || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      full_name: userProfile.full_name || '',
      about_me: userProfile.about_me || '',
      location_city: userProfile.location_city || '',
      location_country: userProfile.location_country || '',
      portfolio_url: userProfile.portfolio_url || '',
      instagram: userProfile.social_links?.instagram || '',
      twitter: userProfile.social_links?.twitter || '',
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (JPG, PNG, WebP).');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image must be smaller than 2MB.');
      return;
    }

    setIsUploadingAvatar(true);
    setErrorMsg(null);

    try {
      // Show local preview immediately
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      const supabase = createClient();

      // Upload to Supabase Storage: avatars/{userId}/avatar.{ext}
      const fileExt = file.name.split('.').pop();
      const filePath = `${userProfile.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          upsert: true,  // Overwrite if exists
          cacheControl: '3600',
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache-busting query parameter so the browser loads the new image
      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      // Save the URL to the profiles table
      await updateProfileAvatar(userProfile.id, finalUrl);

      setAvatarPreview(finalUrl);
      setSuccessMsg('Profile picture updated!');
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload image');
      // Revert preview on error
      setAvatarPreview(userProfile.profile_pic_url || null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onSubmit = async (data: SettingsForm) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateProfile({
        userId: userProfile.id,
        full_name: data.full_name,
        about_me: data.about_me,
        location_city: data.location_city,
        location_country: data.location_country,
        portfolio_url: data.portfolio_url,
        social_links: {
          instagram: data.instagram || '',
          twitter: data.twitter || '',
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
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-8 max-w-3xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Details</h2>

      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">
          {successMsg}
        </div>
      )}
      
      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Profile Picture Upload */}
        <div className="flex items-center gap-6 mb-6">
          <div
            className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0 relative group cursor-pointer"
            onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="text-gray-400 w-10 h-10" />
            )}
            
            {/* Hover overlay */}
            {isUploadingAvatar ? (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="text-white w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                <Camera className="text-white w-5 h-5" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Profile Picture</h3>
            <p className="text-gray-500 text-xs">Click on the picture to upload or change. Max 2MB.</p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>

        <div className="relative">
          <Input label="Display Name *" placeholder="Your public name" error={errors.full_name?.message} {...register('full_name')} />
          <User className="absolute right-3 top-9 text-gray-400" size={16} />
        </div>

        <TextArea label="About Me / Bio" placeholder="Tell the world about your art..." error={errors.about_me?.message} {...register('about_me')} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative">
            <Input label="City" placeholder="New York" error={errors.location_city?.message} {...register('location_city')} />
            <MapPin className="absolute right-3 top-9 text-gray-400" size={16} />
          </div>
          <div className="relative">
            <Input label="Country" placeholder="United States" error={errors.location_country?.message} {...register('location_country')} />
            <MapPin className="absolute right-3 top-9 text-gray-400" size={16} />
          </div>
        </div>

        <div className="relative">
          <Input label="Portfolio / Website URL" placeholder="https://yourwebsite.com" error={errors.portfolio_url?.message} {...register('portfolio_url')} />
          <LinkIcon className="absolute right-3 top-9 text-gray-400" size={16} />
        </div>

        <h3 className="font-bold text-gray-900 mt-8 mb-4">Social Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative">
            <Input label="Instagram Handle" placeholder="@username" error={errors.instagram?.message} {...register('instagram')} />
            <AtSign className="absolute right-3 top-9 text-gray-400" size={16} />
          </div>
          <div className="relative">
            <Input label="Twitter Handle" placeholder="@username" error={errors.twitter?.message} {...register('twitter')} />
            <Globe className="absolute right-3 top-9 text-gray-400" size={16} />
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" isLoading={isLoading} variant="coral">
            <Save size={16} /> Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}


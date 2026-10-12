'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateProfile, updateProfileAvatar } from '@/actions/profileActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import { Save, Camera } from 'lucide-react';
import type { Profile } from '@/types/database';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone_number: z.string().optional(),
  location_country: z.string().optional(),
  location_city: z.string().optional(),
  portfolio_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  about_me: z.string().optional(),
  social_instagram: z.string().optional(),
  social_twitter: z.string().optional(),
  social_website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  profile: Profile;
  showCreatorFields?: boolean;
}

export default function ProfileEditForm({ profile, showCreatorFields = false }: ProfileEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name,
      phone_number: profile.phone_number || '',
      location_country: profile.location_country || '',
      location_city: profile.location_city || '',
      portfolio_url: profile.portfolio_url || '',
      about_me: profile.about_me || '',
      social_instagram: profile.social_links?.instagram || '',
      social_twitter: profile.social_links?.twitter || '',
      social_website: profile.social_links?.website || '',
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

      await updateProfileAvatar(profile.id, urlData.publicUrl);

      router.refresh();
    } catch {
      setError('Failed to upload avatar');
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();

      const updateData: Record<string, unknown> = {
        full_name: data.full_name,
        phone_number: data.phone_number || null,
        location_country: data.location_country || null,
        location_city: data.location_city || null,
        about_me: data.about_me || null,
      };

      if (showCreatorFields) {
        updateData.portfolio_url = data.portfolio_url || null;
        updateData.social_links = {
          instagram: data.social_instagram || undefined,
          twitter: data.social_twitter || undefined,
          website: data.social_website || undefined,
        };
      }

      await updateProfile({ userId: profile.id, ...updateData } as any);

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-8">
      {/* Avatar Section */}
      <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-100">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-orange-300 flex items-center justify-center overflow-hidden shadow-sm">
            {profile.profile_pic_url ? (
              <img src={profile.profile_pic_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-2xl font-bold">
                {profile.full_name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 p-2 rounded-full bg-gray-900 text-white cursor-pointer hover:bg-gray-800 transition-colors shadow-sm">
            <Camera size={12} />
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{profile.full_name}</h2>
          <p className="text-gray-500 text-sm">{profile.email}</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm">
          Profile updated successfully!
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Full Name"
            error={errors.full_name?.message}
            {...register('full_name')}
          />
          <Input
            label="Phone Number"
            error={errors.phone_number?.message}
            {...register('phone_number')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Country"
            placeholder="e.g. United States"
            error={errors.location_country?.message}
            {...register('location_country')}
          />
          <Input
            label="City"
            placeholder="e.g. New York"
            error={errors.location_city?.message}
            {...register('location_city')}
          />
        </div>

        <TextArea
          label="About Me"
          placeholder="Tell us about yourself..."
          error={errors.about_me?.message}
          {...register('about_me')}
        />

        {showCreatorFields && (
          <>
            <Input
              label="Portfolio URL"
              placeholder="https://your-portfolio.com"
              error={errors.portfolio_url?.message}
              {...register('portfolio_url')}
            />

            <div className="border-t border-gray-100 pt-5 mt-5">
              <h3 className="text-base font-bold text-gray-900 mb-4">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input
                  label="Instagram"
                  placeholder="@username"
                  {...register('social_instagram')}
                />
                <Input
                  label="Twitter / X"
                  placeholder="@username"
                  {...register('social_twitter')}
                />
                <Input
                  label="Website"
                  placeholder="https://..."
                  error={errors.social_website?.message}
                  {...register('social_website')}
                />
              </div>
            </div>
          </>
        )}

        <Button type="submit" isLoading={isLoading}>
          <Save size={16} />
          Save Changes
        </Button>
      </form>
    </div>
  );
}

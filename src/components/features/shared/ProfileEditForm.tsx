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
import Card from '@/components/ui/Card';
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
    <Card>
      {/* Avatar Section */}
      <div className="flex items-center gap-6 mb-8 pb-6 border-b-3 border-brand-black">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-brand-black bg-brand-pink flex items-center justify-center overflow-hidden">
            {profile.profile_pic_url ? (
              <img src={profile.profile_pic_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-heading text-3xl font-bold">
                {profile.full_name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 p-2 border-2 border-brand-black bg-brand-yellow cursor-pointer hover:bg-brand-blue hover:text-white transition-colors">
            <Camera size={14} />
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold">{profile.full_name}</h2>
          <p className="text-brand-gray">{profile.email}</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 border-3 border-brand-green bg-green-50 p-3 text-brand-green text-sm font-medium">
          Profile updated successfully!
        </div>
      )}

      {error && (
        <div className="mb-4 border-3 border-brand-red bg-red-50 p-3 text-brand-red text-sm font-medium">
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

            <div className="border-t-3 border-brand-black pt-5 mt-5">
              <h3 className="font-heading text-lg font-bold mb-4">Social Links</h3>
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
          <Save size={18} />
          Save Changes
        </Button>
      </form>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateProfile, updateProfileAvatar } from '@/actions/profileActions';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { Profile } from '@/types/database';

interface CollectorProfileFormProps {
  profile: Profile;
  email: string;
}

export default function CollectorProfileForm({ profile, email }: CollectorProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(profile.full_name || '');
  const [location, setLocation] = useState(profile.location_city || '');
  const [phone, setPhone] = useState(profile.phone_number || '');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile({
        userId: profile.id,
        full_name: fullName,
        location_city: location || null,
        phone_number: phone || null,
      } as any);

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {success && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-emerald-700 text-sm font-medium">
          Profile updated successfully!
        </div>
      )}
      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Profile Image Upload */}
            <div>
              <label className="block w-full h-[88px] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors flex flex-col items-center justify-center bg-white overflow-hidden">
                {profile.profile_pic_url ? (
                  <img src={profile.profile_pic_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center px-4 py-2">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Plus size={16} className="text-gray-400" />
                      <p className="text-sm font-semibold text-gray-900">Profile Image</p>
                    </div>
                    <p className="text-[11px] text-gray-400">Choose an image · stays in browser memory</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            {/* Right: Fields */}
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Second Row: Email + Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
              />
            </div>
          </div>

          {/* Third Row: Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-xs font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>

          <Link
            href="/messages"
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-full text-xs font-semibold hover:bg-gray-50 transition-colors shadow-sm"
          >
            Interest History & Messages
          </Link>

          <Link
            href="/purchases"
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-full text-xs font-semibold hover:bg-gray-50 transition-colors shadow-sm"
          >
            Collection & Purchases
          </Link>
        </div>
      </form>
    </div>
  );
}

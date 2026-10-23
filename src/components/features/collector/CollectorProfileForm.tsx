'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateProfile, updateProfileAvatar } from '@/actions/profileActions';
import { Cloud, Loader2, CheckCircle2, AlertCircle, MessageCircle, ShoppingBag, Compass, User } from 'lucide-react';
import Link from 'next/link';
import type { Profile } from '@/types/database';

interface CollectorProfileFormProps {
  profile: Profile;
  email: string;
}

export default function CollectorProfileForm({ profile, email }: CollectorProfileFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'basic' | 'activity'>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(profile.full_name || '');
  const [location, setLocation] = useState(profile.location_city || '');
  const [phone, setPhone] = useState(profile.phone_number || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.profile_pic_url || null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setIsUploadingAvatar(true);
    setError(null);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await updateProfileAvatar(profile.id, newAvatarUrl);
      setAvatarPreview(newAvatarUrl);
      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload profile picture.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      });

      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    if (!fullName) return 'CO';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <div
      style={{ fontFamily: "'Poppins', sans-serif" }}
      className="w-full text-[#181A1F] pb-12"
    >
      {/* Notifications */}
      {success && (
        <div className="max-w-5xl mx-auto mb-4 bg-emerald-50 border border-emerald-200 rounded-[14px] p-3.5 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Profile updated successfully!</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="text-emerald-500 hover:text-emerald-800 text-xs font-semibold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="max-w-5xl mx-auto mb-4 bg-red-50 border border-red-200 rounded-[14px] p-3.5 text-red-800 text-xs sm:text-sm flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-800 text-xs font-semibold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Behance-style Card Container with Minimalist Aesthetic */}
      <div className="max-w-5xl mx-auto bg-white rounded-[24px] border border-[#E8E8E3] shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-[520px]">
          {/* Left Vertical Navigation Sidebar */}
          <nav className="border-b md:border-b-0 md:border-r border-[#E8E8E3] bg-white flex flex-col justify-between">
            <div>
              {/* 1. Collector Mini Identity Banner */}
              <div className="p-5 border-b border-[#E8E8E3] flex items-center gap-3 bg-white">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#F3F3F3] border border-[#E2E2DC] shrink-0 flex items-center justify-center">
                  {avatarPreview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={avatarPreview} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-[#6E6E69]">{getInitials()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#181A1F] truncate">{fullName || 'Collector'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <p className="text-[10px] text-[#71716D] font-medium">Collector Account</p>
                  </div>
                </div>
              </div>

              {/* 2. Primary Navigation (Clean text only, minimalist design) */}
              <div className="py-2 divide-y divide-[#E8E8E3]/60 bg-white">
                {/* Tab 1: Basic Information */}
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`w-full text-left px-6 py-3.5 transition-colors cursor-pointer block relative focus:outline-none ${
                    activeTab === 'basic'
                      ? 'bg-[#F3F3F3] text-[#181A1F] font-semibold border-l-2 border-[#181A1F]'
                      : 'hover:bg-[#F8F8F8] text-[#7A7A78] hover:text-[#181A1F] font-normal border-l-2 border-transparent'
                  }`}
                >
                  <span className="text-sm block">
                    Basic Information
                  </span>
                </button>

                {/* Tab 2: Account & Activity */}
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={`w-full text-left px-6 py-3.5 transition-colors cursor-pointer block relative focus:outline-none ${
                    activeTab === 'activity'
                      ? 'bg-[#F3F3F3] text-[#181A1F] font-semibold border-l-2 border-[#181A1F]'
                      : 'hover:bg-[#F8F8F8] text-[#7A7A78] hover:text-[#181A1F] font-normal border-l-2 border-transparent'
                  }`}
                >
                  <span className="text-sm block">
                    Account & Activity
                  </span>
                </button>
              </div>

              {/* 3. Quick Collector Activity Shortcuts */}
              <div className="p-5 border-t border-[#E8E8E3] bg-[#FAFAFA]/60 space-y-2">
                <p className="text-[10px] font-semibold text-[#8E8E88] uppercase tracking-wider">
                  Quick Access
                </p>
                <div className="space-y-1.5">
                  <Link
                    href="/messages"
                    className="flex items-center justify-between px-3 py-2 rounded-[10px] bg-white border border-[#E2E2DC] hover:border-[#181A1F] text-xs font-medium text-[#343434] transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle size={14} className="text-[#8E8E88] group-hover:text-[#181A1F]" />
                      <span>Inquiries & Messages</span>
                    </div>
                    <span className="text-[10px] text-[#8E8E88] group-hover:text-[#181A1F]">↗</span>
                  </Link>

                  <Link
                    href="/purchases"
                    className="flex items-center justify-between px-3 py-2 rounded-[10px] bg-white border border-[#E2E2DC] hover:border-[#181A1F] text-xs font-medium text-[#343434] transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-[#8E8E88] group-hover:text-[#181A1F]" />
                      <span>Purchases & Orders</span>
                    </div>
                    <span className="text-[10px] text-[#8E8E88] group-hover:text-[#181A1F]">↗</span>
                  </Link>
                </div>
              </div>

              {/* 4. Verified Status Box */}
              <div className="p-5 border-t border-[#E8E8E3]">
                <div className="bg-[#FAFAFA] border border-[#E8E8E3] rounded-[14px] p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#181A1F]">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Verified Art Patron</span>
                  </div>
                  <p className="text-[10.5px] text-[#71716D] leading-relaxed">
                    Connected with curated creators for artwork inquiries, private previews, and acquisitions.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Bottom Discovery Action */}
            <div className="p-5 border-t border-[#E8E8E3] bg-white space-y-2.5">
              <Link
                href="/discovery"
                style={{
                  background: '#F3F3F3',
                  borderRadius: 12,
                  fontFamily: "'Poppins', sans-serif",
                  color: '#343434',
                  fontWeight: 500,
                }}
                className="w-full py-2.5 px-3 hover:bg-[#EAEAEA] text-xs flex items-center justify-center gap-2 transition-all group"
              >
                <span>Browse Artworks Feed</span>
                <Compass size={13} className="text-[#71716D] group-hover:text-[#181A1F]" />
              </Link>
            </div>
          </nav>

          {/* Right Main Content Pane */}
          <main className="p-7 sm:p-10 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                {/* TAB 1: BASIC INFORMATION */}
                {activeTab === 'basic' && (
                  <section aria-label="Basic Information">

                    <div className="flex flex-col sm:flex-row gap-8 items-start mb-6">
                      {/* Left Sub-column: Avatar Circle & Replace */}
                      <div className="flex flex-col items-center shrink-0 w-full sm:w-36 pt-1">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#F3F3F3] border border-[#E2E2DC] shadow-xs relative flex items-center justify-center">
                          {avatarPreview ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={avatarPreview}
                              alt="Collector Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl sm:text-2xl font-serif font-bold text-[#8E8E88]">
                              {getInitials()}
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
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                          className="mt-3 text-xs font-medium text-[#181A1F] hover:text-black hover:underline transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Cloud size={14} className="text-[#181A1F]" />
                          <span>Replace</span>
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </div>

                      {/* Right Sub-column: Input Fields */}
                      <div className="flex-1 w-full space-y-4">
                        <div>
                          <label
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              color: '#929292',
                              fontWeight: 500,
                            }}
                            className="block text-xs mb-1.5"
                          >
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                            required
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              color: '#181A1F',
                            }}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#E2E2DC] focus:border-[#181A1F] focus:ring-1 focus:ring-[#181A1F] rounded-[12px] text-sm placeholder:text-[#A1A1A1] transition-colors outline-none"
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              color: '#929292',
                              fontWeight: 500,
                            }}
                            className="block text-xs mb-1.5"
                          >
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={email}
                            disabled
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              color: '#8E8E88',
                            }}
                            className="w-full px-3.5 py-2.5 bg-[#F8F8F8] border border-[#E8E8E3] rounded-[12px] text-sm cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              color: '#929292',
                              fontWeight: 500,
                            }}
                            className="block text-xs mb-1.5"
                          >
                            Location
                          </label>
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Mumbai, India"
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              color: '#181A1F',
                            }}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#E2E2DC] focus:border-[#181A1F] focus:ring-1 focus:ring-[#181A1F] rounded-[12px] text-sm placeholder:text-[#A1A1A1] transition-colors outline-none"
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              color: '#929292',
                              fontWeight: 500,
                            }}
                            className="block text-xs mb-1.5"
                          >
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. +91 9876543210"
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              color: '#181A1F',
                            }}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#E2E2DC] focus:border-[#181A1F] focus:ring-1 focus:ring-[#181A1F] rounded-[12px] text-sm placeholder:text-[#A1A1A1] transition-colors outline-none"
                          />
                        </div>

                        {/* Advisory helper box with minimalist styling */}
                        <div className="bg-[#FAFAFA] rounded-[16px] border border-[#E8E8E3] p-4 text-[11px] text-[#555555] space-y-1.5 mt-2">
                          <p className="font-semibold text-[#181A1F] flex items-center gap-1.5">
                            <User size={13} className="text-[#181A1F]" />
                            <span>Collector Verification Notice</span>
                          </p>
                          <p className="leading-relaxed text-[#71716D]">
                            Your full name and location are visible to creators upon submitting acquisition inquiries or provenance registrations. Contact details remain confidential and are solely utilized for certificate verification and art dispatch.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* TAB 2: ACCOUNT & ACTIVITY */}
                {activeTab === 'activity' && (
                  <section aria-label="Account & Activity" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Link
                        href="/messages"
                        className="p-4 rounded-[16px] border border-[#E8E8E3] hover:border-[#181A1F] hover:bg-[#FAFAFA] transition-all flex items-start gap-3.5 group"
                      >
                        <div className="w-10 h-10 rounded-[12px] bg-[#F3F3F3] text-[#181A1F] flex items-center justify-center shrink-0">
                          <MessageCircle size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#181A1F] group-hover:text-black transition-colors">
                            Inquiries & Messages
                          </p>
                          <p className="text-xs text-[#71716D] mt-0.5">
                            Active conversations with creators and artists.
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/purchases"
                        className="p-4 rounded-[16px] border border-[#E8E8E3] hover:border-[#181A1F] hover:bg-[#FAFAFA] transition-all flex items-start gap-3.5 group"
                      >
                        <div className="w-10 h-10 rounded-[12px] bg-[#F3F3F3] text-[#181A1F] flex items-center justify-center shrink-0">
                          <ShoppingBag size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#181A1F] group-hover:text-black transition-colors">
                            Purchases & Orders
                          </p>
                          <p className="text-xs text-[#71716D] mt-0.5">
                            Your acquired artworks and order history.
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/discovery"
                        className="p-4 rounded-[16px] border border-[#E8E8E3] hover:border-[#181A1F] hover:bg-[#FAFAFA] transition-all flex items-start gap-3.5 group sm:col-span-2"
                      >
                        <div className="w-10 h-10 rounded-[12px] bg-[#F3F3F3] text-[#181A1F] flex items-center justify-center shrink-0">
                          <Compass size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#181A1F]">
                            Discover Artworks
                          </p>
                          <p className="text-xs text-[#71716D] mt-0.5">
                            Explore trending original paintings, sculptures, and creator drops.
                          </p>
                        </div>
                      </Link>
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
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
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

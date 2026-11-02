'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateProfile, updateProfileAvatar } from '@/actions/profileActions';
import { Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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

  // Auto-dismiss popups after 4.5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const [fullName, setFullName] = useState(profile.full_name || '');
  const [location, setLocation] = useState(profile.location_city || '');
  const [phone, setPhone] = useState(profile.phone_number || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.profile_pic_url || null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setAvatarPreview(URL.createObjectURL(file));
      const supabase = createClient();
      const optimizedBlob = await optimizeAvatarFile(file);
      const uploadFile = new File([optimizedBlob], 'avatar.webp', { type: 'image/webp' });
      const fileName = `${profile.id}/avatar.webp`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, uploadFile, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await updateProfileAvatar(profile.id, newAvatarUrl);
      setAvatarPreview(newAvatarUrl);
      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload profile picture.');
      setAvatarPreview(profile.profile_pic_url || null);
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
      {/* Notifications - Consistent Blue Theme with Auto-Dismiss */}
      {success && (
        <div
          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
          className="max-w-5xl mx-auto mb-4 bg-[#F1F4FF] border border-[#D1E0FF] rounded-[14px] p-3.5 text-[#0B2E8A] text-xs sm:text-sm flex items-center justify-between shadow-2xs transition-all duration-300 animate-in fade-in slide-in-from-top-1"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-[#1345EE] shrink-0" />
            <span className="font-medium">Profile updated successfully!</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="text-[#1345EE] hover:text-[#082779] text-xs font-semibold ml-4 p-1 hover:bg-blue-100/60 rounded-full cursor-pointer transition-colors"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div
          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
          className="max-w-5xl mx-auto mb-4 bg-red-50 border border-red-200 rounded-[14px] p-3.5 text-red-800 text-xs sm:text-sm flex items-center justify-between shadow-2xs transition-all duration-300 animate-in fade-in slide-in-from-top-1"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-800 text-xs font-semibold ml-4 p-1 hover:bg-red-100/60 rounded-full cursor-pointer transition-colors"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Behance-style Card Container with Minimalist Aesthetic */}
      <div className="max-w-5xl mx-auto bg-white rounded-[24px] border border-[#E8E8E3] shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-[520px]">
          {/* Left Vertical Navigation Sidebar */}
          <nav className="border-b md:border-b-0 md:border-r border-[#E8E8E3] bg-white flex flex-col">
            <div>
              {/* 1. Collector Mini Identity Banner */}
              <div className="p-5 border-b border-[#E8E8E3] flex items-center gap-3 bg-white">
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-[#F3F3F3] border border-[#E2E2DC] shrink-0 flex items-center justify-center">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt={fullName || 'Collector'}
                      fill
                      sizes="44px"
                      className="object-cover"
                      unoptimized={avatarPreview.startsWith('blob:') || avatarPreview.startsWith('data:')}
                    />
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

              {/* 2. Primary Navigation with Signature Soft Pill Hover & Active Effect */}
              <div className="p-3 sm:p-3.5 space-y-1.5 bg-white">
                {/* Tab 1: Basic Information */}
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  style={{
                    background: activeTab === 'basic' ? '#F1F2FF' : 'transparent',
                    borderRadius: 12,
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between transition-all duration-200 cursor-pointer group focus:outline-none ${
                    activeTab === 'basic'
                      ? 'text-[#1345EE] font-medium'
                      : 'text-[#646A77] hover:bg-[#F1F2FF] hover:text-[#1345EE] font-medium'
                  }`}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    }}
                    className="text-[13.5px] block transition-colors"
                  >
                    Basic Information
                  </span>
                  {activeTab === 'basic' && (
                    <span className="w-2 h-2 rounded-full bg-[#1345EE] shrink-0" />
                  )}
                </button>

                {/* Tab 2: Account & Activity */}
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  style={{
                    background: activeTab === 'activity' ? '#F1F2FF' : 'transparent',
                    borderRadius: 12,
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between transition-all duration-200 cursor-pointer group focus:outline-none ${
                    activeTab === 'activity'
                      ? 'text-[#1345EE] font-medium'
                      : 'text-[#646A77] hover:bg-[#F1F2FF] hover:text-[#1345EE] font-medium'
                  }`}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    }}
                    className="text-[13.5px] block transition-colors"
                  >
                    Account & Activity
                  </span>
                  {activeTab === 'activity' && (
                    <span className="w-2 h-2 rounded-full bg-[#1345EE] shrink-0" />
                  )}
                </button>
              </div>

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
                      {/* Left: Avatar Circle with Camera Icon */}
                      <div className="flex flex-col items-center shrink-0 w-full sm:w-44 pt-1">
                        <div className="relative">
                          <div
                            onClick={() => fileInputRef.current?.click()}
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
                                {getInitials()}
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
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                            className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-white border border-[#E2E2DC] hover:border-[#181A1F] hover:bg-[#F8F8F8] text-[#181A1F] shadow-sm flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 z-10"
                            title="Change profile headshot"
                          >
                            <Camera size={14} />
                          </button>
                        </div>

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
                        className="card-gradient-border-hover p-4 sm:p-5 flex items-center justify-between group cursor-pointer select-none"
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                          }}
                          className="text-[14px] font-normal text-[#181A1F] group-hover:text-[#1345EE] transition-colors"
                        >
                          Inquiries & Messages
                        </span>
                      </Link>

                      <Link
                        href="/purchases"
                        className="card-gradient-border-hover p-4 sm:p-5 flex items-center justify-between group cursor-pointer select-none"
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                          }}
                          className="text-[14px] font-normal text-[#181A1F] group-hover:text-[#1345EE] transition-colors"
                        >
                          Purchase & Saved
                        </span>
                      </Link>

                      <Link
                        href="/discovery"
                        className="card-gradient-border-hover p-4 sm:p-5 flex items-center justify-between group cursor-pointer select-none sm:col-span-2"
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                          }}
                          className="text-[14px] font-normal text-[#181A1F] group-hover:text-[#1345EE] transition-colors"
                        >
                          Discover Artworks
                        </span>
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
                        <span>Save Profile</span>
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

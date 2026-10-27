'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Maximize2, X } from 'lucide-react';

interface ArtistProfileAvatarProps {
  profilePicUrl?: string | null;
  fullName: string;
  initials: string;
}

export default function ArtistProfileAvatar({
  profilePicUrl,
  fullName,
  initials,
}: ArtistProfileAvatarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close modal on Escape key press and lock background scrolling
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalOpen]);

  return (
    <>
      {/* Centered Avatar Frame */}
      <div
        className={`w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-[#E5E5E5] flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.14)] border-4 border-white font-sans ring-1 ring-black/5 relative select-none ${
          profilePicUrl ? 'cursor-pointer group' : ''
        }`}
        style={{ fontFamily: "'Poppins', sans-serif" }}
        onClick={() => {
          if (profilePicUrl) setIsModalOpen(true);
        }}
        title={profilePicUrl ? 'Click to view full photo' : fullName}
      >
        {profilePicUrl ? (
          <div className="w-full h-full rounded-full overflow-hidden relative">
            <Image
              src={profilePicUrl}
              alt={fullName || 'Profile'}
              fill
              sizes="(max-width: 640px) 128px, (max-width: 768px) 144px, 160px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority
            />

            {/* Hover Indicator Overlay */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex flex-col items-center justify-center text-white pointer-events-none">
              <Maximize2 size={20} className="drop-shadow-md mb-0.5" />
              <span className="text-[10px] font-medium tracking-wide drop-shadow-md">View</span>
            </div>
          </div>
        ) : (
          <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-700">
            {initials}
          </span>
        )}
      </div>

      {/* Pop-up Window Modal (Large High-Resolution Profile Photo Lightbox) */}
      {isModalOpen && profilePicUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Profile photo preview"
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          {/* Top-right close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(false);
            }}
            className="absolute top-5 right-5 sm:top-6 sm:right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors cursor-pointer z-10"
            aria-label="Close profile photo view"
            title="Close (Esc)"
          >
            <X size={22} />
          </button>

          {/* Modal Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[90vh] flex flex-col items-center animate-in zoom-in-95 duration-200"
          >
            {/* High-Resolution Large Profile Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profilePicUrl}
                alt={fullName || 'Profile Photograph'}
                className="max-w-full max-h-[72vh] sm:max-h-[76vh] w-auto h-auto object-contain block"
              />
            </div>

            {/* Caption */}
            <div className="text-center mt-4">
              <h3
                className="text-xl sm:text-2xl text-white font-serif italic tracking-tight"
                style={{ fontFamily: "'Century Schoolbook', Century, serif", fontStyle: 'italic' }}
              >
                {fullName}
              </h3>
              <p
                className="text-xs text-white/60 font-sans mt-0.5 tracking-wide uppercase text-[11px]"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Creator Profile Photograph
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

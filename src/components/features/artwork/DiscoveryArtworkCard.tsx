'use client';

import React from 'react';
import Link from 'next/link';
import { PROTECTED_CONTAINER_CLASS, PROTECTED_IMAGE_CLASS } from '@/lib/media/assetProtection';

export interface DiscoveryArtworkCardProps {
  artwork: {
    id: string;
    title: string;
    image_url: string;
    art_type?: string | null;
    artist_name?: string | null;
    status?: string | null;
    profiles?: {
      full_name?: string | null;
      profile_pic_url?: string | null;
    } | null;
  };
  creatorName?: string;
  creatorAvatar?: string | null;
  className?: string;
}

const getInitials = (name: string) => {
  if (!name) return 'A';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default function DiscoveryArtworkCard({
  artwork,
  creatorName: explicitCreatorName,
  creatorAvatar: explicitCreatorAvatar,
  className = '',
}: DiscoveryArtworkCardProps) {
  const creatorName =
    explicitCreatorName ||
    artwork.artist_name ||
    artwork.profiles?.full_name ||
    'Independent Artist';

  const avatarUrl =
    explicitCreatorAvatar ||
    artwork.profiles?.profile_pic_url ||
    null;

  return (
    <div className={`break-inside-avoid mb-4 sm:mb-5 group ${className}`}>
      <div className="relative bg-white rounded-[22px] p-2 border border-[#EBEBE6] shadow-[0_2px_10px_rgba(20,20,19,0.03)] hover:shadow-[0_10px_28px_rgba(20,20,19,0.08)] transition-all duration-300">
        <Link href={`/artwork/${artwork.id}`} className="block cursor-pointer">
          {/* Artwork Image Container with Anti-Download Shield */}
          <div className={`relative overflow-hidden rounded-[18px] bg-[#F5F5F0] ${PROTECTED_CONTAINER_CLASS}`}>
            <img
              src={artwork.image_url}
              alt={artwork.title}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              className={`w-full h-auto object-cover block group-hover:scale-[1.018] transition-transform duration-500 ease-out select-none pointer-events-none ${PROTECTED_IMAGE_CLASS}`}
              loading="lazy"
            />

            {/* Transparent overlay shield */}
            <div
              className="absolute inset-0 z-[2]"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              aria-hidden="true"
            />

            {/* Medium Badge (subtle overlay on top-right on hover) */}
            {artwork.art_type && (
              <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="inline-block px-2.5 py-1 text-[9px] font-normal uppercase tracking-wider rounded-full bg-white/95 backdrop-blur-md text-[#141413] shadow-xs">
                  {artwork.art_type}
                </span>
              </div>
            )}
          </div>

          {/* Single Row: [Avatar] Creator Name on left, Availability on right */}
          <div className="pt-2.5 pb-1 px-1 flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-2 truncate">
              <div
                className="w-5 h-5 rounded-full bg-gray-200 border border-gray-300/60 overflow-hidden flex items-center justify-center text-[9px] font-normal text-gray-700 shrink-0 font-sans"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(creatorName)
                )}
              </div>
              <span
                className="text-[12px] sm:text-[13px] font-normal text-[#141413] group-hover:text-[#B8532F] transition-colors truncate"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                {creatorName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  artwork.status === 'Available'
                    ? 'bg-emerald-500'
                    : artwork.status === 'Sold'
                    ? 'bg-red-400'
                    : 'bg-amber-400'
                }`}
              />
              <span
                className="text-[11px] sm:text-[12px] font-normal text-gray-600 capitalize tracking-tight"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                {artwork.status || 'Available'}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}


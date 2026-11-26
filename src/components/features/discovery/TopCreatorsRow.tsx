'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { RankedCreator } from '@/lib/services/rankingService';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface TopCreatorsRowProps {
  creators: RankedCreator[];
  isLoading?: boolean;
}

export default function TopCreatorsRow({ creators, isLoading }: TopCreatorsRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'CR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getRankBadge = (rank: number) => {
    const formattedRank = `No. ${rank.toString().padStart(2, '0')}`;
    if (rank === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[#141413] text-white shadow-xs">
          {formattedRank}
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[#262624] text-white shadow-xs">
          {formattedRank}
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[#40403C] text-white shadow-xs">
          {formattedRank}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-white/95 backdrop-blur-xs text-[#141413] border border-[#EBEBE6] shadow-2xs">
        {formattedRank}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full my-8 bg-white border border-[#E8E8E3] rounded-3xl p-5 sm:p-7 shadow-[0_4px_24px_rgba(20,20,19,0.03)] overflow-hidden animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-[#ECECE7] rounded-full" />
            <div className="h-7 w-48 bg-[#ECECE7] rounded-xl" />
          </div>
          <div className="flex gap-2">
            <div className="w-9 h-9 rounded-full bg-[#ECECE7]" />
            <div className="w-9 h-9 rounded-full bg-[#ECECE7]" />
          </div>
        </div>
        <div className="flex gap-4 sm:gap-5 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-[240px] sm:w-[260px] shrink-0 bg-white rounded-[22px] border border-[#EBEBE6] overflow-hidden flex flex-col justify-between"
            >
              <div className="h-24 bg-[#ECECE7] w-full" />
              <div className="px-4 pb-4 -mt-9 flex flex-col items-center space-y-3">
                <div className="w-18 h-18 rounded-full bg-[#E5E5DF] ring-4 ring-white" />
                <div className="h-4 w-32 bg-[#ECECE7] rounded-full mt-2" />
                <div className="h-3 w-20 bg-[#ECECE7] rounded-full" />
                <div className="h-12 w-full bg-[#FAF8F5] border border-[#EBEBE6] rounded-xl" />
                <div className="h-9 w-full bg-[#ECECE7] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!creators || creators.length === 0) {
    return null;
  }

  return (
    <section className="w-full my-8 bg-white border border-[#E8E8E3] rounded-3xl p-5 sm:p-7 shadow-[0_4px_24px_rgba(20,20,19,0.03)] overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.16em] bg-[#FAF8F5] text-[#73736C] border border-[#EBEBE6] mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#100E90]" />
            <span>Curated Leaderboard</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#141413] font-bold tracking-tight">
            Top Creators
          </h2>
          <p className="text-xs sm:text-sm text-[#73736C] mt-0.5 font-normal">
            Ranked in real-time by patron demand, acquisitions, and verified studio portfolio.
          </p>
        </div>

        {/* Desktop Carousel Navigation */}
        <div className="hidden sm:flex items-center gap-2 self-end">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full bg-white border border-[#EBEBE6] flex items-center justify-center text-[#141413] hover:bg-[#141413] hover:text-white hover:border-[#141413] transition-colors shadow-2xs cursor-pointer active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full bg-white border border-[#EBEBE6] flex items-center justify-center text-[#141413] hover:bg-[#141413] hover:text-white hover:border-[#141413] transition-colors shadow-2xs cursor-pointer active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Snap Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 pt-1 px-1 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {creators.map((creator) => (
          <div
            key={creator.id}
            className="w-[240px] sm:w-[260px] shrink-0 snap-start bg-white rounded-[22px] border border-[#EBEBE6] hover:border-[#141413] p-0 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_12px_30px_rgba(20,20,19,0.07)] hover:-translate-y-1 overflow-hidden group"
          >
            {/* Top Artwork Cover Banner */}
            <div className="h-24 w-full relative overflow-hidden bg-[#F5F5F0]">
              {creator.featuredImageUrl ? (
                <img
                  src={creator.featuredImageUrl}
                  alt={creator.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#F5F5F0] via-[#ECECE7] to-[#E2E2DC] flex items-center justify-center">
                  <span className="font-serif italic text-xs text-[#9E9E98]/60 tracking-wider">Studio Archive</span>
                </div>
              )}
              {/* Subtle gradient wash */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-transparent to-black/20" />

              {/* Top Rank Badge */}
              <div className="absolute top-2.5 left-2.5 z-10">
                {getRankBadge(creator.rank)}
              </div>

              {/* Real-time Index / Score Badge */}
              <div className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 text-[10px] font-medium tracking-wide text-[#141413] bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-[#EBEBE6] shadow-2xs">
                <span className="text-[#9E9E98] text-[9px] uppercase font-bold tracking-wider">Score</span>
                <span className="font-bold text-[#100E90] tabular-nums">{creator.score}</span>
              </div>
            </div>

            {/* Avatar Section Overlapping Cover */}
            <div className="px-4 pb-4 -mt-9 flex flex-col flex-grow justify-between text-center relative z-10">
              <div className="relative mx-auto mb-2.5">
                <div className="w-18 h-18 rounded-full p-1 bg-white shadow-md ring-1 ring-black/5">
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    {creator.profilePicUrl ? (
                      <img
                        src={creator.profilePicUrl}
                        alt={creator.name}
                        className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#141413] text-white flex items-center justify-center font-serif font-bold text-sm rounded-full">
                        {getInitials(creator.name)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Verified Creator Emblem */}
                {creator.isPremium && (
                  <div
                    className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#100E90] text-white flex items-center justify-center border-2 border-white shadow-xs"
                    title="Verified Studio Creator"
                  >
                    <Check size={11} strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Creator Names & Discipline */}
              <div className="mb-1">
                <h3 className="font-serif font-bold text-[#141413] text-base leading-snug group-hover:text-[#100E90] transition-colors truncate">
                  {creator.name}
                </h3>
                <p className="text-[10px] text-[#73736C] font-semibold tracking-[0.14em] uppercase truncate mt-0.5">
                  {creator.discipline || 'Visual Arts'}
                </p>
                {creator.location && (
                  <p className="text-[11px] text-[#9E9E98] truncate mt-0.5">
                    {creator.location}
                  </p>
                )}
              </div>

              {/* 3-Column Studio Metrics Strip */}
              <div className="grid grid-cols-3 gap-1 py-2 px-1.5 rounded-xl bg-[#FAF8F5] border border-[#EBEBE6] my-3 text-center">
                <div>
                  <p className="text-[9px] uppercase font-semibold tracking-wider text-[#9E9E98]">Works</p>
                  <p className="text-xs font-bold text-[#141413] mt-0.5 tabular-nums">
                    {creator.artworkCount}
                  </p>
                </div>
                <div className="border-x border-[#EBEBE6]">
                  <p className="text-[9px] uppercase font-semibold tracking-wider text-[#9E9E98]">Inquiries</p>
                  <p className="text-xs font-bold text-[#141413] mt-0.5 tabular-nums">
                    {creator.inquiryCount}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-semibold tracking-wider text-[#9E9E98]">Saves</p>
                  <p className="text-xs font-bold text-[#141413] mt-0.5 tabular-nums">
                    {creator.saveCount}
                  </p>
                </div>
              </div>

              {/* View Portfolio Action Button */}
              <Link
                href={`/artist/${creator.id}`}
                className="w-full inline-flex items-center justify-center py-2.5 px-3 rounded-full text-xs font-semibold bg-[#141413] text-white hover:bg-black transition-all duration-200 shadow-2xs"
              >
                View Portfolio
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

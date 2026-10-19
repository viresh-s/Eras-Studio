'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { RankedCreator } from '@/lib/services/rankingService';
import { ChevronLeft, ChevronRight, Sparkles, Check, ArrowRight } from 'lucide-react';

interface TopCreatorsRowProps {
  creators: RankedCreator[];
  isLoading?: boolean;
}

export default function TopCreatorsRow({ creators, isLoading }: TopCreatorsRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
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
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
          <span>#1</span>
          <span className="text-[10px]">👑</span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800 shadow-xs">
          #2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
          #3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
        #{rank}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full my-8 bg-white/60 border border-[#E8E8E3] rounded-3xl p-6 sm:p-8 backdrop-blur-xs">
        <div className="h-6 bg-gray-200 rounded-full w-48 mb-4 animate-pulse" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[260px] h-[320px] bg-white rounded-2xl border border-[#E8E8E3] animate-pulse shrink-0 p-5" />
          ))}
        </div>
      </div>
    );
  }

  if (!creators || creators.length === 0) {
    return null;
  }

  return (
    <section className="w-full my-8 bg-gradient-to-b from-[#FAF5EC] via-white to-[#FAF5EC] border border-[#E8E8E3] rounded-3xl p-5 sm:p-7 shadow-[0_4px_24px_rgba(20,20,19,0.03)] overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#141413] font-bold tracking-tight">
            Top Creators
          </h2>
        </div>

        {/* Desktop Carousel Navigation */}
        <div className="hidden sm:flex items-center gap-2 self-end">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full bg-white border border-[#E8E8E3] flex items-center justify-center text-[#141413] hover:bg-[#141413] hover:text-[#FAF5EC] hover:border-[#141413] transition-colors shadow-xs cursor-pointer active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full bg-white border border-[#E8E8E3] flex items-center justify-center text-[#141413] hover:bg-[#141413] hover:text-[#FAF5EC] hover:border-[#141413] transition-colors shadow-xs cursor-pointer active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Snap Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {creators.map((creator) => (
          <div
            key={creator.id}
            className="w-[230px] sm:w-[250px] shrink-0 snap-start bg-white rounded-2xl border border-[#E8E8E3] hover:border-[#141413] p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 group"
          >
            {/* Top Rank & Score Bar */}
            <div className="flex items-center justify-between mb-4">
              {getRankBadge(creator.rank)}
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-[#FAF5EC] px-2 py-0.5 rounded-full border border-[#E8E8E3]">
                <span className="text-amber-500">★</span>
                <span>{creator.score} pts</span>
              </div>
            </div>

            {/* Avatar & Verification Ring */}
            <div className="relative mx-auto mb-3.5">
              <div
                className={`w-20 h-20 rounded-full overflow-hidden p-0.5 relative ${
                  creator.isPremium
                    ? 'ring-2 ring-amber-500 ring-offset-2'
                    : 'ring-1 ring-gray-200 ring-offset-1'
                }`}
              >
                {creator.profilePicUrl ? (
                  <img
                    src={creator.profilePicUrl}
                    alt={creator.name}
                    className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2C4A5A] text-[#FAF5EC] flex items-center justify-center font-bold text-sm rounded-full">
                    {getInitials(creator.name)}
                  </div>
                )}
              </div>

              {/* Verified Pro Badge Icon */}
              {creator.isPremium && (
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white shadow-xs"
                  title="Verified Professional Creator"
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Creator Information */}
            <div className="text-center mb-4">
              <h3 className="font-serif font-bold text-[#141413] text-base leading-tight truncate group-hover:text-[#B8532F] transition-colors">
                {creator.name}
              </h3>
              <p className="text-[11px] text-[#865E16] font-medium tracking-wide uppercase mt-1 truncate">
                {creator.discipline}
              </p>
              {creator.location && (
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                  {creator.location}
                </p>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 py-2.5 px-3 rounded-xl bg-[#FAF5EC]/80 border border-[#E8E8E3]/60 mb-4 text-center">
              <div>
                <p className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Works</p>
                <p className="text-xs font-semibold text-[#141413] mt-0.5">
                  {creator.artworkCount} published
                </p>
              </div>
              <div className="border-l border-[#E8E8E3]">
                <p className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Demand</p>
                <p className="text-xs font-semibold text-[#141413] mt-0.5">
                  {creator.inquiryCount > 0 ? `${creator.inquiryCount} Inquiries` : `${creator.saveCount} Saves`}
                </p>
              </div>
            </div>

            {/* View Profile Action Link */}
            <Link
              href={`/artist/${creator.id}`}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold bg-[#141413] text-[#FAF5EC] hover:bg-black transition-all duration-200 group/btn"
            >
              <span>View Portfolio</span>
              <ArrowRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform duration-200" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

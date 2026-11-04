'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Bookmark,
  Eye,
  MessageSquare,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { PROTECTED_CONTAINER_CLASS, PROTECTED_IMAGE_CLASS } from '@/lib/media/assetProtection';
import DiscoveryArtworkCard from '@/components/features/artwork/DiscoveryArtworkCard';

const PROGRESS_STAGES = [
  'Interest Raised',
  'Discussion',
  'Confirmed',
  'Processing',
  'Completed',
];

export interface FormattedAcquisition {
  id: string;
  artworkId: string;
  title: string;
  imageUrl: string;
  price: number | null;
  status?: string;
  artType?: string | null;
  creatorName: string;
  creatorAvatar?: string | null;
  createdAt: string;
  initialStatus: string;
  dbStatus?: string;
}

export interface SavedArtwork {
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
}

interface PurchasesClientProps {
  initialAcquisitions: FormattedAcquisition[];
  savedArtworks: SavedArtwork[];
}

const getInitials = (name: string) => {
  if (!name) return 'A';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default function PurchasesClient({
  initialAcquisitions,
  savedArtworks,
}: PurchasesClientProps) {
  // Tabs: 'Interested' (active/ongoing acquisitions), 'Completed', 'Saved'
  const [activeTab, setActiveTab] = useState<'Interested' | 'Completed' | 'Saved'>('Interested');

  // Local optimistic state for order tracking stages
  const [statuses, setStatuses] = useState<Record<string, string>>(
    initialAcquisitions.reduce(
      (acc, acq) => ({ ...acc, [acq.id]: acq.initialStatus }),
      {}
    )
  );

  const handleStatusChange = (id: string, newStatus: string) => {
    setStatuses((prev) => ({ ...prev, [id]: newStatus }));
  };

  const activeAcquisitions = initialAcquisitions.filter(
    (acq) => statuses[acq.id] !== 'Completed'
  );
  const completedAcquisitions = initialAcquisitions.filter(
    (acq) => statuses[acq.id] === 'Completed'
  );

  const formatPrice = (price: number | null) => {
    if (!price) return 'Price on Request';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderEmptyState = (tabName: string) => (
    <div className="bg-white rounded-3xl border border-gray-200 p-12 sm:p-16 flex flex-col items-center justify-center text-center mt-2 shadow-2xs min-h-[360px]">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2356FF] flex items-center justify-center mb-4">
        {tabName === 'Saved' ? (
          <Bookmark size={26} />
        ) : tabName === 'Completed' ? (
          <CheckCircle2 size={26} />
        ) : (
          <Layers size={26} />
        )}
      </div>
      <h3
        className="text-2xl font-serif italic font-normal text-gray-900 mb-2 tracking-tight"
        style={{
          fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
          fontStyle: 'italic',
        }}
      >
        No {tabName.toLowerCase()} items found
      </h3>
      <p
        className="text-xs text-gray-500 font-normal max-w-md mx-auto mb-6 leading-relaxed"
        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
      >
        {tabName === 'Saved'
          ? 'Browse original paintings, sculptures, and creator drops in Discovery to save your favorites here.'
          : tabName === 'Completed'
          ? 'Completed purchases and finalized acquisitions will appear in this archive.'
          : 'Artwork acquisitions are coordinated directly with creators through private inquiry channels.'}
      </p>
      <Link
        href="/discovery"
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full text-xs font-normal hover:bg-black transition-all shadow-xs cursor-pointer select-none"
        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
      >
        <Eye size={14} />
        <span>Explore Artworks</span>
      </Link>
    </div>
  );

  const tabs = [
    { id: 'Interested', label: 'Interested', count: activeAcquisitions.length },
    { id: 'Completed', label: 'Completed', count: completedAcquisitions.length },
    { id: 'Saved', label: 'Saved', count: savedArtworks.length },
  ] as const;

  return (
    <div style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>
      {/* Header matching website portfolio / dashboard pages */}
      <div className="mb-8">
        <h1
          className="text-4xl sm:text-5xl font-serif italic font-semibold text-[var(--color-cor-ink,#141413)] tracking-tight"
          style={{
            fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
            fontStyle: 'italic',
          }}
        >
          Purchases &amp; Saved
        </h1>
      </div>

      {/* Tabs with Blue Gradient on Active Tab (Identical unified box-sizing with ZERO jump) */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={
                isActive
                  ? {
                      position: 'relative',
                      background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                      boxShadow:
                        '0px 4px 14px rgba(35, 77, 255, 0.2), 0px 2px 2px rgba(255, 255, 255, 0.65) inset, 0px -2px 4px rgba(6, 42, 137, 0.33) inset',
                      borderColor: '#2356FF',
                    }
                  : {
                      borderColor: '#E5E7EB',
                    }
              }
              className={`relative h-9 px-4 sm:px-5 inline-flex items-center justify-center gap-1.5 rounded-full border text-xs font-normal select-none cursor-pointer overflow-hidden box-border ${
                isActive
                  ? 'text-white'
                  : 'bg-white text-gray-700 hover:bg-[#F4F4ED] hover:border-gray-300'
              }`}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 2,
                    borderRadius: 28,
                    border: '1px rgba(255, 255, 255, 0.15) solid',
                    pointerEvents: 'none',
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 leading-none">
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-normal leading-none ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content (Instant switch, stable viewport, zero jump) */}
      <div className="relative min-h-[480px]">
        {/* INTERESTED TAB (Active acquisitions rendered in Discovery masonry layout) */}
        {activeTab === 'Interested' && (
          activeAcquisitions.length === 0
            ? renderEmptyState('Interested')
            : (
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 sm:gap-5 [column-fill:_balance]">
                {activeAcquisitions.map((acq) => {
                  const currentStageIdx = PROGRESS_STAGES.indexOf(statuses[acq.id]);

                  return (
                    <div
                      key={acq.id}
                      className="break-inside-avoid mb-4 sm:mb-5 group"
                    >
                      <div className="relative bg-white rounded-[22px] p-2 sm:p-2.5 border border-[#EBEBE6] shadow-[0_2px_10px_rgba(20,20,19,0.03)] hover:shadow-[0_10px_28px_rgba(20,20,19,0.08)] transition-all duration-300 flex flex-col">
                        {/* Artwork Clickable Area: Image & Discovery Row */}
                        <Link href={`/artwork/${acq.artworkId}`} className="block cursor-pointer">
                          {/* Image with Anti-Download Shield & Natural Dynamic Height (h-auto) */}
                          <div className={`relative overflow-hidden rounded-[18px] bg-[#F5F5F0] ${PROTECTED_CONTAINER_CLASS}`}>
                            <img
                              src={acq.imageUrl}
                              alt={acq.title}
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

                            {/* Medium Badge */}
                            {acq.artType && (
                              <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <span className="inline-block px-2.5 py-1 text-[9px] font-normal uppercase tracking-wider rounded-full bg-white/95 backdrop-blur-md text-[#141413] shadow-xs">
                                  {acq.artType}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Discovery Single Row: [Avatar] Creator Name on left, Availability on right */}
                          <div className="pt-2.5 pb-1 px-1 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex items-center gap-2 truncate">
                              <div
                                className="w-5 h-5 rounded-full bg-gray-200 border border-gray-300/60 overflow-hidden flex items-center justify-center text-[9px] font-normal text-gray-700 shrink-0 font-sans"
                                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                              >
                                {acq.creatorAvatar ? (
                                  <img
                                    src={acq.creatorAvatar}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  getInitials(acq.creatorName)
                                )}
                              </div>
                              <span
                                className="text-[12px] sm:text-[13px] font-normal text-[#141413] group-hover:text-[#B8532F] transition-colors truncate"
                                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                              >
                                {acq.creatorName}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 pl-1">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  acq.status === 'Available'
                                    ? 'bg-emerald-500'
                                    : acq.status === 'Sold'
                                    ? 'bg-red-400'
                                    : 'bg-amber-400'
                                }`}
                              />
                              <span
                                className="text-[11px] sm:text-[12px] font-normal text-gray-600 capitalize tracking-tight"
                                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                              >
                                {acq.status || 'Available'}
                              </span>
                            </div>
                          </div>
                        </Link>

                        {/* Integrated Acquisition Controls */}
                        <div className="mt-2 pt-2 border-t border-gray-100 px-1 flex flex-col gap-2">
                          {/* Title & Price */}
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/artwork/${acq.artworkId}`} className="block truncate">
                              <h3
                                className="text-sm font-serif italic font-normal text-gray-900 tracking-tight truncate hover:text-[#1345EE] transition-colors"
                                style={{
                                  fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                                  fontStyle: 'italic',
                                }}
                              >
                                {acq.title}
                              </h3>
                            </Link>
                            <span className="text-[11px] font-normal text-gray-500 shrink-0">
                              {formatPrice(acq.price)}
                            </span>
                          </div>

                          {/* Stage Progress Tracker */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-gray-400 font-normal">
                              <span>Stage {currentStageIdx + 1} of 5</span>
                              <span className="text-[#1345EE] font-normal truncate max-w-[120px]">
                                {statuses[acq.id]}
                              </span>
                            </div>
                            <div className="grid grid-cols-5 gap-1">
                              {PROGRESS_STAGES.map((stage, idx) => {
                                const isDone = idx <= currentStageIdx;
                                return (
                                  <div
                                    key={stage}
                                    title={`${idx + 1}. ${stage}`}
                                    className={`h-1 rounded-full transition-all duration-200 ${
                                      isDone
                                        ? 'bg-gradient-to-r from-[#1345EE] to-[#458CFF]'
                                        : 'bg-gray-100'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          {/* Quick Stage select & Conversation button */}
                          <div className="flex items-center gap-2 pt-1">
                            <div className="relative flex-1">
                              <select
                                value={statuses[acq.id]}
                                onChange={(e) => handleStatusChange(acq.id, e.target.value)}
                                className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[11px] font-normal text-gray-800 rounded-lg py-1.5 pl-2 pr-6 focus:outline-none focus:border-[#2356FF] cursor-pointer transition-colors"
                              >
                                {PROGRESS_STAGES.map((stage) => (
                                  <option key={stage} value={stage}>
                                    {stage}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={12}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                              />
                            </div>

                            <Link
                              href={`/messages/${acq.id}`}
                              title="Open Conversation"
                              className="p-1.5 px-2.5 bg-[#181A1F] text-white rounded-lg text-[11px] font-normal hover:bg-black transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 select-none"
                            >
                              <MessageSquare size={12} />
                              <span>Chat</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
        )}

        {/* COMPLETED TAB (Masonry Columns: adjusts dynamically to artwork dimensions) */}
        {activeTab === 'Completed' && (
          completedAcquisitions.length === 0
            ? renderEmptyState('Completed')
            : (
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 sm:gap-5 [column-fill:_balance]">
                {completedAcquisitions.map((acq) => (
                  <div
                    key={acq.id}
                    className="break-inside-avoid mb-4 sm:mb-5 group opacity-95"
                  >
                    <div className="relative bg-white rounded-[22px] p-2 sm:p-2.5 border border-[#EBEBE6] shadow-[0_2px_10px_rgba(20,20,19,0.03)] hover:shadow-[0_10px_28px_rgba(20,20,19,0.08)] transition-all duration-300 flex flex-col">
                      <Link href={`/artwork/${acq.artworkId}`} className="block cursor-pointer">
                        <div className={`relative overflow-hidden rounded-[18px] bg-[#F5F5F0] ${PROTECTED_CONTAINER_CLASS}`}>
                          <img
                            src={acq.imageUrl}
                            alt={acq.title}
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                            onDragStart={(e) => e.preventDefault()}
                            className={`w-full h-auto object-cover block group-hover:scale-[1.018] transition-transform duration-500 ease-out select-none pointer-events-none ${PROTECTED_IMAGE_CLASS}`}
                            loading="lazy"
                          />
                          <div
                            className="absolute inset-0 z-[2]"
                            onContextMenu={(e) => e.preventDefault()}
                            onDragStart={(e) => e.preventDefault()}
                            aria-hidden="true"
                          />
                          <div className="absolute top-2.5 left-2.5 z-10">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-normal uppercase tracking-wider rounded-full bg-emerald-500/95 backdrop-blur-md text-white shadow-xs">
                              <CheckCircle2 size={10} /> Completed
                            </span>
                          </div>
                        </div>

                        <div className="pt-2.5 pb-1 px-1 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex items-center gap-2 truncate">
                            <div
                              className="w-5 h-5 rounded-full bg-gray-200 border border-gray-300/60 overflow-hidden flex items-center justify-center text-[9px] font-normal text-gray-700 shrink-0 font-sans"
                              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                            >
                              {acq.creatorAvatar ? (
                                <img
                                  src={acq.creatorAvatar}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                getInitials(acq.creatorName)
                              )}
                            </div>
                            <span
                              className="text-[12px] sm:text-[13px] font-normal text-[#141413] group-hover:text-[#B8532F] transition-colors truncate"
                              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                            >
                              {acq.creatorName}
                            </span>
                          </div>

                          <span className="text-[11px] sm:text-[12px] font-normal text-emerald-600">
                            Acquired
                          </span>
                        </div>
                      </Link>

                      <div className="mt-2 pt-2 border-t border-gray-100 px-1 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className="text-sm font-serif italic font-normal text-gray-900 tracking-tight truncate"
                            style={{
                              fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                              fontStyle: 'italic',
                            }}
                          >
                            {acq.title}
                          </h3>
                          <span className="text-[11px] font-normal text-gray-500 shrink-0">
                            {formatPrice(acq.price)}
                          </span>
                        </div>

                        <Link
                          href={`/messages/${acq.id}`}
                          className="w-full py-1.5 border border-gray-200 text-gray-700 rounded-lg text-[11px] font-normal hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span>View Dialogue</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
        )}

        {/* SAVED TAB (Rendered in Discovery Masonry Columns) */}
        {activeTab === 'Saved' && (
          savedArtworks.length > 0 ? (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 sm:gap-5 [column-fill:_balance] mt-2">
              {savedArtworks.map((artwork) => (
                <DiscoveryArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  creatorName={artwork.profiles?.full_name || artwork.artist_name}
                  creatorAvatar={artwork.profiles?.profile_pic_url}
                />
              ))}
            </div>
          ) : (
            renderEmptyState('Saved')
          )
        )}
      </div>
    </div>
  );
}

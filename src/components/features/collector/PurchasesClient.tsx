'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Bookmark,
  Eye,
  MessageSquare,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  Package,
} from 'lucide-react';
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

interface PurchasesClientProps {
  initialAcquisitions: FormattedAcquisition[];
  savedArtworks: any[];
}

export default function PurchasesClient({
  initialAcquisitions,
  savedArtworks,
}: PurchasesClientProps) {
  const [activeTab, setActiveTab] = useState<'Active' | 'Completed' | 'Interested' | 'Saved'>('Active');

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
    <div className="bg-white rounded-3xl border border-gray-200 p-16 flex flex-col items-center justify-center text-center mt-6 shadow-2xs">
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

  return (
    <div style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>
      {/* Header matching website portfolio / dashboard pages */}
      <div className="mb-8">
        <h1
          className="text-4xl sm:text-5xl font-serif italic font-semibold text-[var(--color-cor-ink,#141413)] tracking-tight mb-2"
          style={{
            fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
            fontStyle: 'italic',
          }}
        >
          Purchases &amp; Saved
        </h1>
        <p className="text-xs sm:text-sm font-normal text-gray-500 max-w-2xl leading-relaxed">
          Track your active acquisitions, completed orders, creator inquiries, and curated saved artworks.
        </p>
      </div>

      {/* Website-themed Stats Cards Strip (matching /portfolio) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div
          onClick={() => setActiveTab('Active')}
          className={`rounded-3xl border p-5 transition-all cursor-pointer ${
            activeTab === 'Active'
              ? 'bg-blue-50/60 border-[#2356FF]/40 shadow-xs'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-[11px] font-normal tracking-[0.15em] text-gray-500 uppercase mb-2">
            Active
          </p>
          <p className="text-3xl font-normal text-gray-900">
            {activeAcquisitions.length}
          </p>
        </div>

        <div
          onClick={() => setActiveTab('Completed')}
          className={`rounded-3xl border p-5 transition-all cursor-pointer ${
            activeTab === 'Completed'
              ? 'bg-blue-50/60 border-[#2356FF]/40 shadow-xs'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-[11px] font-normal tracking-[0.15em] text-gray-500 uppercase mb-2">
            Completed
          </p>
          <p className="text-3xl font-normal text-gray-900">
            {completedAcquisitions.length}
          </p>
        </div>

        <div
          onClick={() => setActiveTab('Interested')}
          className={`rounded-3xl border p-5 transition-all cursor-pointer ${
            activeTab === 'Interested'
              ? 'bg-blue-50/60 border-[#2356FF]/40 shadow-xs'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-[11px] font-normal tracking-[0.15em] text-gray-500 uppercase mb-2">
            Interested
          </p>
          <p className="text-3xl font-normal text-gray-900">
            {initialAcquisitions.length}
          </p>
        </div>

        <div
          onClick={() => setActiveTab('Saved')}
          className={`rounded-3xl border p-5 transition-all cursor-pointer ${
            activeTab === 'Saved'
              ? 'bg-blue-50/60 border-[#2356FF]/40 shadow-xs'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-[11px] font-normal tracking-[0.15em] text-gray-500 uppercase mb-2">
            Saved
          </p>
          <p className="text-3xl font-normal text-gray-900">
            {savedArtworks.length}
          </p>
        </div>
      </div>

      {/* Tabs with Blue Gradient on Active Tab */}
      <div className="flex flex-wrap items-center gap-2.5 mb-8">
        {(['Active', 'Completed', 'Interested', 'Saved'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const count =
            tab === 'Active'
              ? activeAcquisitions.length
              : tab === 'Completed'
              ? completedAcquisitions.length
              : tab === 'Interested'
              ? initialAcquisitions.length
              : savedArtworks.length;

          if (isActive) {
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  position: 'relative',
                  background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                  boxShadow:
                    '0px 7px 22px rgba(35, 77, 255, 0.13), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
                  overflow: 'hidden',
                  borderRadius: 40,
                  outline: '2px #2356FF solid',
                  outlineOffset: '-2px',
                }}
                className="px-6 py-2.5 sm:px-7 sm:py-3 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 select-none shadow-md"
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
                <span
                  style={{
                    color: 'white',
                    fontSize: 13,
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: '400',
                    lineHeight: '20px',
                  }}
                  className="flex items-center gap-2 relative z-10"
                >
                  <span>{tab}</span>
                  <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-6 py-2.5 sm:px-7 sm:py-3 inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-[#F4F4ED] hover:border-gray-300 transition-all cursor-pointer text-xs font-normal select-none"
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              <span>{tab}</span>
              <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {/* ACTIVE TAB */}
        {activeTab === 'Active' && (
          activeAcquisitions.length === 0
            ? renderEmptyState('Active')
            : (
              <div className="space-y-6">
                {activeAcquisitions.map((acq) => (
                  <div
                    key={acq.id}
                    className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 flex flex-col lg:flex-row gap-8 shadow-2xs"
                  >
                    {/* Discovery-style Card on Left */}
                    <div className="w-full sm:w-64 shrink-0">
                      <DiscoveryArtworkCard
                        artwork={{
                          id: acq.artworkId,
                          title: acq.title,
                          image_url: acq.imageUrl,
                          art_type: acq.artType,
                          status: acq.status,
                        }}
                        creatorName={acq.creatorName}
                        creatorAvatar={acq.creatorAvatar}
                      />
                    </div>

                    {/* Acquisition Details & Stepper on Right */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <span className="inline-flex px-3 py-1 bg-blue-50 border border-blue-200 text-[#1345EE] text-[11px] font-normal rounded-full">
                            Current Stage: {statuses[acq.id]}
                          </span>
                          <span className="text-xs text-gray-400 font-normal">
                            Acquisition ID: #{acq.id.slice(0, 8)}
                          </span>
                        </div>

                        <h2
                          className="text-2xl sm:text-3xl font-serif italic font-normal text-gray-900 mb-2 tracking-tight"
                          style={{
                            fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                            fontStyle: 'italic',
                          }}
                        >
                          {acq.title}
                        </h2>

                        <p className="text-xs sm:text-sm text-gray-500 mb-8 font-normal">
                          By {acq.creatorName} &middot; {formatPrice(acq.price)}
                        </p>

                        {/* Progress Stepper */}
                        <div className="mb-8">
                          <div className="grid grid-cols-5 gap-2 sm:gap-3">
                            {PROGRESS_STAGES.map((stage, idx) => {
                              const currentStageIdx = PROGRESS_STAGES.indexOf(statuses[acq.id]);
                              const isPastOrActive = idx <= currentStageIdx;

                              return (
                                <div key={stage} className="flex flex-col gap-2">
                                  <span
                                    className={`text-[10px] tracking-wider uppercase font-normal truncate ${
                                      isPastOrActive ? 'text-[#1345EE]' : 'text-gray-400'
                                    }`}
                                  >
                                    {idx + 1}. {stage}
                                  </span>
                                  <div
                                    className={`h-1.5 rounded-full w-full transition-all duration-300 ${
                                      isPastOrActive
                                        ? 'bg-gradient-to-r from-[#1345EE] to-[#458CFF]'
                                        : 'bg-gray-100'
                                    }`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Controls: Stage Selector & Message Button */}
                      <div className="pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <label className="text-xs font-normal text-gray-600 shrink-0">
                            Update Stage:
                          </label>
                          <div className="relative min-w-[180px]">
                            <select
                              value={statuses[acq.id]}
                              onChange={(e) => handleStatusChange(acq.id, e.target.value)}
                              className="w-full appearance-none bg-white border border-gray-200 text-xs font-normal text-gray-900 rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:border-[#2356FF] focus:ring-1 focus:ring-[#2356FF] cursor-pointer"
                            >
                              {PROGRESS_STAGES.map((stage) => (
                                <option key={stage} value={stage}>
                                  {stage}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={14}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                          </div>
                        </div>

                        <Link
                          href={`/messages/${acq.id}`}
                          className="px-5 py-2.5 bg-[#181A1F] text-white rounded-full text-xs font-normal hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs select-none"
                        >
                          <MessageSquare size={13} />
                          <span>Open Conversation</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
        )}

        {/* COMPLETED TAB */}
        {activeTab === 'Completed' && (
          completedAcquisitions.length === 0
            ? renderEmptyState('Completed')
            : (
              <div className="space-y-6">
                {completedAcquisitions.map((acq) => (
                  <div
                    key={acq.id}
                    className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 flex flex-col lg:flex-row gap-8 shadow-2xs opacity-95"
                  >
                    <div className="w-full sm:w-64 shrink-0">
                      <DiscoveryArtworkCard
                        artwork={{
                          id: acq.artworkId,
                          title: acq.title,
                          image_url: acq.imageUrl,
                          art_type: acq.artType,
                          status: 'Sold',
                        }}
                        creatorName={acq.creatorName}
                        creatorAvatar={acq.creatorAvatar}
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-normal rounded-full">
                            <CheckCircle2 size={12} /> Acquisition Completed
                          </span>
                        </div>

                        <h2
                          className="text-2xl sm:text-3xl font-serif italic font-normal text-gray-900 mb-2 tracking-tight"
                          style={{
                            fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                            fontStyle: 'italic',
                          }}
                        >
                          {acq.title}
                        </h2>

                        <p className="text-xs sm:text-sm text-gray-500 mb-6 font-normal">
                          Acquired from {acq.creatorName} &middot; {formatPrice(acq.price)}
                        </p>
                      </div>

                      <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-normal">
                          Archived in your permanent collection
                        </span>
                        <Link
                          href={`/messages/${acq.id}`}
                          className="px-5 py-2 border border-gray-200 text-gray-700 rounded-full text-xs font-normal hover:bg-gray-50 transition-colors"
                        >
                          View Dialogue History
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
        )}

        {/* INTERESTED TAB */}
        {activeTab === 'Interested' && (
          initialAcquisitions.length === 0
            ? renderEmptyState('Interested')
            : (
              <div className="space-y-4">
                {initialAcquisitions.map((acq) => (
                  <div
                    key={acq.id}
                    className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                        <img
                          src={acq.imageUrl}
                          alt={acq.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3
                          className="text-lg font-serif italic font-normal text-gray-900 tracking-tight truncate"
                          style={{
                            fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                            fontStyle: 'italic',
                          }}
                        >
                          {acq.title}
                        </h3>
                        <p className="text-xs text-gray-500 font-normal truncate">
                          {acq.creatorName} &middot; {formatPrice(acq.price)}
                        </p>
                        <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-normal uppercase tracking-wider rounded-full">
                          {acq.dbStatus || 'Pending'}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/messages/${acq.id}`}
                      className="px-5 py-2.5 bg-white border border-gray-200 hover:border-gray-400 text-gray-900 rounded-full text-xs font-normal transition-all text-center shrink-0 shadow-2xs"
                    >
                      View Interest Dialogue
                    </Link>
                  </div>
                ))}
              </div>
            )
        )}

        {/* SAVED TAB (Rendered in Discovery Masonry Columns) */}
        {activeTab === 'Saved' && (
          savedArtworks.length > 0 ? (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 sm:gap-5 [column-fill:_balance] mt-2">
              {savedArtworks.map((artwork: any) => (
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

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Share2, Check, ExternalLink } from 'lucide-react';
import ArtworkImageGallery from './ArtworkImageGallery';
import ExpandableDescription from './ExpandableDescription';
import ExpressInterestButton from './ExpressInterestButton';
import SaveArtworkButton from './SaveArtworkButton';
import ReportArtworkButton from './ReportArtworkButton';

interface CreatorProfile {
  full_name: string;
  profile_pic_url: string | null;
  about_me: string | null;
  portfolio_url: string | null;
}

interface ArtworkData {
  id: string;
  creator_id: string;
  title: string;
  art_type: string;
  artist_name: string;
  description: string | null;
  external_link: string | null;
  image_url: string;
  additional_images: string[];
  price: number | null;
  status: string;
  year: string | null;
  dimensions: string | null;
  location: string | null;
  style: string | null;
  tags: string[];
  collection: string | null;
  price_visibility: string | null;
  profiles?: CreatorProfile | null;
}

interface ArtworkDiscoveryDetailProps {
  artwork: ArtworkData;
  currentUser: { id: string } | null;
  userRole: string | null;
  existingChat?: { id: string; status: string; created_at: string } | null;
  isSaved?: boolean;
}

export default function ArtworkDiscoveryDetail({
  artwork,
  currentUser,
  userRole,
  existingChat,
  isSaved = false,
}: ArtworkDiscoveryDetailProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const isOwner = currentUser?.id === artwork.creator_id;
  const canExpress = currentUser && userRole === 'User' && !isOwner;
  const creator = artwork.profiles;

  const handleShare = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-[1400px] mx-auto px-6 py-10 lg:py-14">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/discovery"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-900 hover:bg-gray-50 transition-colors shadow-xs"
          >
            <ArrowLeft size={14} />
            Back to discovery
          </Link>

          {/* Share Action */}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
            aria-label="Share artwork link"
          >
            {copiedLink ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-600 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 size={14} />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column: Image Gallery */}
          <div className="w-full sticky top-24">
            <ArtworkImageGallery
              primaryImage={artwork.image_url}
              additionalImages={artwork.additional_images || []}
              altText={artwork.title}
            />
          </div>

          {/* Right Column: Details & Moderation Actions */}
          <div className="pt-2 lg:pt-6 w-full max-w-2xl mx-auto space-y-8">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-2.5 py-1 bg-gray-100 rounded-md">
                  {artwork.art_type || 'Fine Art'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-[11px] font-medium text-gray-500">
                  {artwork.year || 'Current Period'}
                </span>
                {artwork.status && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        artwork.status === 'Available'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {artwork.status}
                    </span>
                  </>
                )}
              </div>

              <h1
                className="text-4xl sm:text-5xl lg:text-6xl text-gray-900 mb-5 tracking-tight font-heading leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {artwork.title}
              </h1>

              {/* Artist Card Link */}
              <Link
                href={`/artist/${artwork.creator_id}`}
                className="inline-flex items-center gap-3 p-1.5 pr-4 rounded-full hover:bg-gray-100 transition-colors -ml-1 border border-transparent hover:border-gray-200"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 overflow-hidden ring-1 ring-gray-200">
                  {creator?.profile_pic_url ? (
                    <img
                      src={creator.profile_pic_url}
                      alt={creator.full_name || 'Creator'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    creator?.full_name?.substring(0, 2).toUpperCase() || 'AR'
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 block leading-none">
                    {creator?.full_name || artwork.artist_name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">Verified Artist Profile ↗</span>
                </div>
              </Link>
            </div>

            {/* Expandable Description */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Artwork Overview
              </h2>
              <ExpandableDescription text={artwork.description || 'No description provided by the artist.'} />
            </div>

            {/* Metadata Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs divide-y divide-gray-100 text-xs sm:text-sm">
              {[
                { label: 'Medium & Technique', value: artwork.style || artwork.art_type },
                { label: 'Dimensions', value: artwork.dimensions || 'Contact artist' },
                { label: 'Year Created', value: artwork.year || 'Contemporary' },
                { label: 'Origin / Location', value: artwork.location || 'Studio Collection' },
                { label: 'Series / Collection', value: artwork.collection || 'Independent Work' },
                { label: 'Acquisition Availability', value: artwork.status },
              ].map((item, idx) => (
                <div key={idx} className="flex px-5 py-3.5 items-center justify-between">
                  <span className="text-gray-500 font-medium">{item.label}</span>
                  <span className="text-gray-900 font-semibold text-right">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Price & Primary Actions Bar */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-soft space-y-6">
              <div className="flex items-baseline justify-between border-b border-gray-100 pb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Direct Acquisition
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                    {artwork.price_visibility === 'Hidden' || !artwork.price
                      ? 'Price on request'
                      : `$${artwork.price.toLocaleString()}`}
                  </p>
                </div>
                {artwork.external_link && (
                  <a
                    href={artwork.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    <span>External Link</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Interaction Actions Bar */}
              <div className="flex flex-wrap items-center gap-3">
                {canExpress ? (
                  <ExpressInterestButton
                    artworkId={artwork.id}
                    creatorId={artwork.creator_id}
                    userId={currentUser.id}
                    initialChatId={existingChat?.id}
                    initialStatus={existingChat?.status}
                    initialCreatedAt={existingChat?.created_at}
                  />
                ) : !currentUser ? (
                  <Link
                    href="/login"
                    className="px-6 py-3 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors shadow-xs"
                  >
                    Sign in to Express Interest →
                  </Link>
                ) : null}

                {/* Save / Bookmark Button */}
                {currentUser && !isOwner && (
                  <SaveArtworkButton
                    artworkId={artwork.id}
                    initialIsSaved={isSaved}
                    userId={currentUser.id}
                  />
                )}

                {/* View Creator Button */}
                <Link
                  href={`/artist/${artwork.creator_id}`}
                  className="px-5 py-3 bg-white border border-gray-200 text-gray-900 rounded-full text-xs font-bold hover:bg-gray-50 transition-colors shadow-xs"
                >
                  View Creator
                </Link>

                {/* Report Artwork Button (Moderation & Safety) */}
                {!isOwner && (
                  <ReportArtworkButton
                    artworkId={artwork.id}
                    artworkTitle={artwork.title}
                    artworkOwnerId={artwork.creator_id}
                    userId={currentUser?.id || null}
                    iconType="flag"
                    variant="button"
                  />
                )}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-gray-400">
                <p>
                  Direct connection with verified artist. Safe transactions supervised under ERAS terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

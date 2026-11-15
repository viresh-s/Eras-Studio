'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  image_url_full?: string | null;
  additional_images: string[];
  additional_images_full?: string[] | null;
  image_width?: number | null;
  image_height?: number | null;
  aspect_ratio?: number | null;
  price: number | null;
  status: string;
  year: string | null;
  dimensions: string | null;
  width: string | null;
  height: string | null;
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
    <div className="min-h-screen bg-[#FDFDFC]" style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <Link
            href="/discovery"
            className="btn-gradient-border-hover inline-flex items-center px-4 py-2 rounded-full text-xs font-medium shadow-2xs"
          >
            <span>Back to discovery</span>
          </Link>

          {/* Share Action */}
          <button
            onClick={handleShare}
            className="btn-gradient-border-hover inline-flex items-center px-4 py-2 rounded-full text-xs font-medium shadow-2xs cursor-pointer"
            aria-label="Share artwork link"
          >
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* Left Column: Image Gallery */}
          <div className="w-full lg:sticky lg:top-24">
            <ArtworkImageGallery
              primaryImage={artwork.image_url}
              primaryImageFull={artwork.image_url_full}
              additionalImages={artwork.additional_images || []}
              additionalImagesFull={artwork.additional_images_full || []}
              altText={artwork.title}
            />
          </div>

          {/* Right Column: Details & Actions */}
          <div className="pt-2 lg:pt-4 w-full max-w-2xl mx-auto space-y-6 sm:space-y-7">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-medium text-[#141413] uppercase tracking-wider px-3 py-1 bg-white border border-[#E8E8E3] rounded-full shadow-2xs">
                  {artwork.art_type || 'Fine Art'}
                </span>
                <span className="text-[#E8E8E3]">•</span>
                <span className="text-[11px] font-normal text-[#6E6E69]">
                  {artwork.year || 'Current Period'}
                </span>
                {artwork.status && (
                  <>
                    <span className="text-[#E8E8E3]">•</span>
                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                        artwork.status === 'Available'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                          : artwork.status === 'Sold'
                          ? 'bg-red-50 text-red-700 border-red-200/60'
                          : 'bg-gray-100 text-gray-700 border-gray-200/60'
                      }`}
                    >
                      {artwork.status}
                    </span>
                  </>
                )}
              </div>

              <h1
                className="text-3xl sm:text-4xl lg:text-5xl text-[#141413] mb-4 tracking-tight font-serif italic leading-tight"
                style={{
                  fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                  fontStyle: 'italic',
                }}
              >
                {artwork.title}
              </h1>

              {/* Artist Card Link */}
              <Link
                href={`/artist/${artwork.creator_id}`}
                className="inline-flex items-center gap-3 p-1.5 pr-4 rounded-full hover:bg-gray-50 transition-colors -ml-1 border border-transparent hover:border-[#E8E8E3]"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-[#141413] overflow-hidden border border-[#E8E8E3]">
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
                  <span className="text-sm font-medium text-[#141413] block leading-none">
                    {creator?.full_name || artwork.artist_name}
                  </span>
                  <span className="text-[10px] text-[#6E6E69] font-normal mt-0.5 block">Verified Artist Profile</span>
                </div>
              </Link>
            </div>

            {/* Expandable Description */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E8E3] shadow-2xs">
              <h2 className="text-[11px] font-medium text-[#6E6E69] uppercase tracking-[0.08em] mb-2.5">
                Artwork Overview
              </h2>
              <ExpandableDescription text={artwork.description || 'No description provided by the artist.'} />
            </div>

            {/* Metadata Table */}
            <div className="bg-white rounded-2xl border border-[#E8E8E3] overflow-hidden shadow-2xs divide-y divide-[#E8E8E3] text-xs sm:text-[13px]">
              {[
                { label: 'Medium & Technique', value: artwork.style || artwork.art_type },
                { 
                  label: 'Dimensions', 
                  value: (artwork.width && artwork.height) 
                    ? `${artwork.width} × ${artwork.height}` 
                    : (artwork.dimensions || 'Contact artist') 
                },
                { label: 'Year Created', value: artwork.year || 'Contemporary' },
                { label: 'Origin / Location', value: artwork.location || 'Studio Collection' },
                { label: 'Series / Collection', value: artwork.collection || 'Independent Work' },
                { label: 'Acquisition Availability', value: artwork.status },
              ].map((item, idx) => (
                <div key={idx} className="flex px-5 py-3.5 items-center justify-between">
                  <span className="text-[#6E6E69] font-normal">{item.label}</span>
                  <span className="text-[#141413] font-medium text-right">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Price & Primary Actions Bar */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8E8E3] shadow-xs space-y-6">
              <div className="flex items-baseline justify-between border-b border-[#E8E8E3] pb-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#6E6E69] mb-1">
                    Direct Acquisition
                  </p>
                  {artwork.price_visibility === 'Hide Price' || artwork.price_visibility === 'Hidden' ? (
                    <p className="text-xl font-medium text-[#6E6E69]">
                      Price not disclosed
                    </p>
                  ) : artwork.price_visibility === 'Price on Request' || !artwork.price ? (
                    <p
                      className="text-2xl sm:text-3xl font-normal text-[#141413]"
                      style={{
                        fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                        fontStyle: 'italic',
                      }}
                    >
                      Price on request
                    </p>
                  ) : (
                    <p
                      className="text-2xl sm:text-3xl font-normal text-[#141413]"
                      style={{
                        fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                        fontStyle: 'italic',
                      }}
                    >
                      ₹{artwork.price.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
                {artwork.external_link && (
                  <a
                    href={artwork.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gradient-border-hover inline-flex items-center px-3 py-1.5 rounded-full text-xs font-normal"
                  >
                    <span>External Link</span>
                  </a>
                )}
              </div>

              {/* Interaction Actions Bar */}
              <div className="flex flex-wrap items-center gap-3">
                {(() => {
                  const isPriceOnRequest =
                    artwork.price_visibility === 'Price on Request' ||
                    (!artwork.price &&
                      artwork.price_visibility !== 'Hide Price' &&
                      artwork.price_visibility !== 'Hidden');

                  if (canExpress) {
                    return (
                      <ExpressInterestButton
                        artworkId={artwork.id}
                        creatorId={artwork.creator_id}
                        userId={currentUser.id}
                        initialChatId={existingChat?.id}
                        initialStatus={existingChat?.status}
                        initialCreatedAt={existingChat?.created_at}
                        isPriceOnRequest={isPriceOnRequest}
                        artworkTitle={artwork.title}
                      />
                    );
                  }

                  if (!currentUser) {
                    return (
                      <Link
                        href="/login"
                        className="btn-premium-gradient-pill px-6 py-2.5 text-white rounded-full text-xs font-medium shadow-2xs"
                      >
                        <span>
                          {isPriceOnRequest
                            ? 'Sign in to Request Price'
                            : 'Sign in to Express Interest'}
                        </span>
                      </Link>
                    );
                  }

                  return null;
                })()}

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
                  className="btn-gradient-border-hover px-5 py-2.5 rounded-full text-xs font-medium shadow-2xs"
                >
                  <span>View Creator</span>
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

              <div className="pt-2 flex items-center justify-between text-[11px] text-[#6E6E69] font-normal">
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

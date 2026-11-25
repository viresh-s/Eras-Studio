'use client';

import { useState } from 'react';
import Link from 'next/link';
import ArtworkGridCard from '@/components/features/creator/ArtworkGridCard';
import { CollectionItem } from '@/actions/collectionActions';
import { recordCollectionView } from '@/actions/metricsActions';
import {
  ArrowLeft,
  Folder,
  Layers,
  Sparkles,
  Heart,
  Eye,
  Award,
  MapPin,
  Calendar,
  FileText,
  Download,
  ExternalLink,
  Globe,
  Pencil,
  Palette,
  CheckCircle2,
} from 'lucide-react';

function InstagramIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface ProfileTabsProps {
  artworks: any[];
  profile: any;
  collections?: CollectionItem[];
  isOwner?: boolean;
  currentUserId?: string;
}

export default function ProfileTabs({
  artworks,
  profile,
  collections = [],
  isOwner = false,
  currentUserId,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('works');
  const [selectedCollection, setSelectedCollection] = useState<CollectionItem | null>(null);

  const tabs = [
    { id: 'works', label: 'Selected Works' },
    { id: 'collection', label: 'Collections' },
    { id: 'about', label: 'About' },
  ];

  // Helper formatting functions
  const formatExternalUrl = (url?: string | null) => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const cleanDisplayUrl = (url?: string | null) => {
    if (!url) return '';
    return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
  };

  // Parsed profile data
  const awardsList: string[] = profile.awards
    ? profile.awards
        .split(/\r?\n|;/)
        .map((item: string) => item.replace(/^[•\-\*]\s*/, '').trim())
        .filter((item: string) => item.length > 0)
    : [];

  const artFormsList: string[] = Array.isArray(profile.art_forms)
    ? profile.art_forms
    : typeof profile.art_forms === 'string'
    ? profile.art_forms
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];

  const instagramHandle = profile.social_links?.instagram || '';
  const portfolioLink = profile.portfolio_url || profile.social_links?.website || '';
  const otherLinksList: string[] = profile.other_links
    ? profile.other_links
        .split(/[,\n]/)
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0)
    : [];

  const hasAnyLinks = Boolean(
    instagramHandle || portfolioLink || otherLinksList.length > 0
  );

  const hasAnyDocuments = Boolean(
    profile.cv_file_url ||
      profile.short_portfolio_file_url ||
      profile.long_portfolio_file_url ||
      profile.artist_bio_file_url ||
      profile.top_artworks_drive_url
  );

  // If user switches tab, reset selected collection
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedCollection(null);
  };

  // Open and record view for a whole collection
  const handleSelectCollection = (col: CollectionItem) => {
    setSelectedCollection(col);
    try {
      const storageKey = `eras_view_col_${col.id}`;
      if (!sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, '1');
        recordCollectionView(col.id);
      }
    } catch {
      recordCollectionView(col.id);
    }
  };

  // Filter artworks for the active selected collection view
  const activeCollectionArtworks = selectedCollection
    ? artworks.filter(
        (a) =>
          a.collection_id === selectedCollection.id ||
          (a.collection && a.collection.trim().toLowerCase() === selectedCollection.title.trim().toLowerCase())
      )
    : [];

  return (
    <div style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>
      {/* Tab Headers */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 scrollbar-none border-b border-transparent">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-5 sm:px-6 py-2 sm:py-2.5 text-xs font-normal rounded-full transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Selected Works */}
      {activeTab === 'works' && (
        <div>
          {artworks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
              {artworks.map((artwork) => (
                <ArtworkGridCard key={artwork.id} artwork={artwork} creatorName={profile.full_name} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm font-normal">No artworks published yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Collections */}
      {activeTab === 'collection' && (
        <div>
          {selectedCollection ? (
            /* Single Collection Deep-View */
            <div>
              {/* Back button and Collection Details */}
              <div className="mb-8">
                <button
                  onClick={() => setSelectedCollection(null)}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors mb-4 font-normal cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to all collections
                </button>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-gray-100 pb-5">
                  <div>
                    <h2
                      className="text-3xl font-serif italic font-normal text-gray-900 tracking-tight"
                      style={{
                        fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                        fontStyle: 'italic',
                      }}
                    >
                      {selectedCollection.title}
                    </h2>
                    {selectedCollection.description && (
                      <p className="text-xs text-gray-600 font-normal mt-2 max-w-2xl leading-relaxed">
                        {selectedCollection.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-normal shrink-0">
                    <div className="flex items-center gap-1" title={`${selectedCollection.likes_count || 0} likes`}>
                      <Heart size={13} className="text-gray-400" strokeWidth={1.75} />
                      <span>{selectedCollection.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1" title={`${selectedCollection.views_count || 0} views`}>
                      <Eye size={13} className="text-gray-400" strokeWidth={1.75} />
                      <span>{selectedCollection.views_count || 0}</span>
                    </div>
                    <span className="text-gray-300">·</span>
                    <span>
                      {activeCollectionArtworks.length}{' '}
                      {activeCollectionArtworks.length === 1 ? 'Artwork' : 'Artworks'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Artworks in this Collection */}
              {activeCollectionArtworks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                  {activeCollectionArtworks.map((artwork) => (
                    <ArtworkGridCard key={artwork.id} artwork={artwork} creatorName={profile.full_name} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50/60 rounded-3xl border border-gray-100">
                  <p className="text-gray-500 text-xs font-normal">
                    No published artworks currently assigned to this collection.
                  </p>
                </div>
              )}
            </div>
          ) : collections.length > 0 ? (
            /* Grid of Collection Cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {collections.map((col) => {
                const count = artworks.filter(
                  (a) =>
                    a.collection_id === col.id ||
                    (a.collection && a.collection.trim().toLowerCase() === col.title.trim().toLowerCase())
                ).length;

                return (
                  <div
                    key={col.id}
                    onClick={() => handleSelectCollection(col)}
                    className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col"
                  >
                    {/* Cover Preview */}
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      {col.cover_image_url ? (
                        <img
                          src={col.cover_image_url}
                          alt={col.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                          <Folder size={36} className="opacity-40" />
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-normal px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <Layers size={11} />
                        <span>
                          {count} {count === 1 ? 'Artwork' : 'Artworks'}
                        </span>
                      </div>
                    </div>

                    {/* Card Info */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3
                          className="text-xl font-serif italic font-normal text-gray-900 tracking-tight mb-1.5 group-hover:text-[#2356FF] transition-colors"
                          style={{
                            fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                            fontStyle: 'italic',
                          }}
                        >
                          {col.title}
                        </h3>
                        {col.description ? (
                          <p className="text-xs text-gray-600 line-clamp-2 font-normal leading-relaxed">
                            {col.description}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 font-normal italic">Series Collection</p>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-normal">
                        <div className="flex items-center gap-3 text-[11px] text-[#6E6E69]">
                          <div className="flex items-center gap-1" title={`${col.likes_count || 0} likes`}>
                            <Heart size={13} className="text-[#6E6E69]" strokeWidth={1.75} />
                            <span>{col.likes_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1" title={`${col.views_count || 0} views`}>
                            <Eye size={13} className="text-[#6E6E69]" strokeWidth={1.75} />
                            <span>{col.views_count || 0}</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#2356FF] font-medium">Explore Collection</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-gray-100">
              <Folder size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm font-normal">No collections published yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: About (Upgraded Gallery-Grade Artist Dossier) */}
      {activeTab === 'about' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* ========================================================= */}
          {/* LEFT COLUMN: Narrative & Credentials (8 of 12 cols)       */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">
            {/* 1. Artist Statement (If present) */}
            {profile.artist_statement && (
              <div className="bg-[#FAF9F5] border border-[#E8E8E3] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xs">
                {/* Subtle watermark quote mark */}
                <span
                  className="absolute -top-3 right-5 text-7xl text-[#E8E8E3]/60 font-serif select-none pointer-events-none"
                  aria-hidden="true"
                >
                  “
                </span>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1345EE]" />
                  <h3
                    className="text-[11px] font-semibold tracking-[0.15em] text-[#6E6E69] uppercase"
                    style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                  >
                    Artist Statement
                  </h3>
                </div>
                <blockquote
                  className="text-base sm:text-lg text-[#141413] leading-relaxed font-serif italic relative z-10"
                  style={{
                    fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;{profile.artist_statement}&rdquo;
                </blockquote>
              </div>
            )}

            {/* 2. Biography & Practice (If present) */}
            {profile.about_me && (
              <div className="bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-8 shadow-2xs">
                <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#F0EFEA]">
                  <h3
                    className="text-xs font-semibold tracking-[0.15em] text-[#6E6E69] uppercase"
                    style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                  >
                    Biography & Practice
                  </h3>
                  {profile.primary_medium && (
                    <span className="text-[11px] text-[#6E6E69] font-normal">
                      {profile.primary_medium}
                    </span>
                  )}
                </div>
                <div className="text-sm sm:text-[15px] text-[#2C2C2A] leading-relaxed font-normal space-y-4">
                  {profile.about_me.split(/\n\s*\n/).map((paragraph: string, idx: number) => (
                    <p key={idx} className="leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Exhibitions, Awards & Honors (If present) */}
            {awardsList.length > 0 && (
              <div className="bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-8 shadow-2xs">
                <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-[#F0EFEA]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-[#FAF5EC] border border-[#EACEC0] flex items-center justify-center text-[#865E16] shrink-0">
                      <Award size={15} />
                    </div>
                    <h3
                      className="text-xs font-semibold tracking-[0.15em] text-[#6E6E69] uppercase"
                      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                    >
                      Exhibitions, Awards & Honors
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#6E6E69] font-normal">
                    {awardsList.length} {awardsList.length === 1 ? 'Accolade' : 'Accolades'}
                  </span>
                </div>

                <div className="divide-y divide-[#F0EFEA]">
                  {awardsList.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3 group"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#1345EE] mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                      <p className="text-sm text-[#141413] leading-relaxed font-normal">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback if no narrative details exist */}
            {!profile.about_me && !profile.artist_statement && awardsList.length === 0 && (
              <div className="bg-white border border-[#E8E8E3] rounded-3xl p-10 text-center shadow-2xs">
                <p className="text-gray-500 text-sm font-normal">No biographical details provided yet.</p>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Quick Facts, Documents & Connect (4 cols)   */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 flex flex-col gap-6 w-full">
            {/* Card 1: Artist Overview & Disciplines */}
            <div className="bg-white border border-[#E8E8E3] rounded-3xl p-6 shadow-2xs flex flex-col gap-5">
              <h3
                className="text-xs font-semibold tracking-[0.15em] text-[#6E6E69] uppercase pb-2 border-b border-[#F0EFEA]"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                Studio & Practice
              </h3>

              <div className="flex flex-col gap-4 text-xs">
                {/* Studio Location */}
                {(profile.location_city || profile.location_country) && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                      <MapPin size={14} />
                    </div>
                    <div>
                      <p className="text-[11px] text-[#6E6E69] font-medium">Studio Location</p>
                      <p className="text-[#141413] font-medium mt-0.5">
                        {[profile.location_city, profile.location_country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Primary Medium */}
                {profile.primary_medium && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                      <Palette size={14} />
                    </div>
                    <div>
                      <p className="text-[11px] text-[#6E6E69] font-medium">Primary Medium</p>
                      <p className="text-[#141413] font-medium mt-0.5">{profile.primary_medium}</p>
                    </div>
                  </div>
                )}

                {/* Member Since */}
                {profile.created_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <p className="text-[11px] text-[#6E6E69] font-medium">Member Since</p>
                      <p className="text-[#141413] font-medium mt-0.5">
                        {new Date(profile.created_at).getFullYear()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Published Works Stat */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                    <Layers size={14} />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6E6E69] font-medium">Archive Summary</p>
                    <p className="text-[#141413] font-medium mt-0.5">
                      {artworks.length} {artworks.length === 1 ? 'Artwork' : 'Artworks'}
                      {collections.length > 0 && ` · ${collections.length} ${collections.length === 1 ? 'Collection' : 'Collections'}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Art Forms & Focus Disciplines */}
              {artFormsList.length > 0 && (
                <div className="pt-4 border-t border-[#F0EFEA]">
                  <p className="text-[11px] text-[#6E6E69] font-semibold uppercase tracking-wider mb-2.5">
                    Focus Disciplines
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {artFormsList.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-[#FAF9F5] border border-[#E8E8E3] text-[11px] font-normal text-[#141413]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Official Documents / CV (If present) */}
            {hasAnyDocuments && (
              <div className="bg-white border border-[#E8E8E3] rounded-3xl p-6 shadow-2xs flex flex-col gap-4">
                <h3
                  className="text-xs font-semibold tracking-[0.15em] text-[#6E6E69] uppercase pb-2 border-b border-[#F0EFEA]"
                  style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                >
                  Documents & Dossier
                </h3>

                <div className="flex flex-col gap-2.5">
                  {profile.cv_file_url && (
                    <a
                      href={profile.cv_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F5] hover:bg-[#F2F0ED] border border-[#E8E8E3] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E8E3] flex items-center justify-center text-[#1345EE] shrink-0">
                          <FileText size={15} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-medium text-[#141413] truncate">Curriculum Vitae</p>
                          <p className="text-[10px] text-[#6E6E69]">Official Artist CV (PDF)</p>
                        </div>
                      </div>
                      <Download size={14} className="text-[#6E6E69] group-hover:text-[#1345EE] transition-colors shrink-0 ml-2" />
                    </a>
                  )}

                  {profile.short_portfolio_file_url && (
                    <a
                      href={profile.short_portfolio_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F5] hover:bg-[#F2F0ED] border border-[#E8E8E3] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E8E3] flex items-center justify-center text-[#1345EE] shrink-0">
                          <FileText size={15} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-medium text-[#141413] truncate">Artist Portfolio</p>
                          <p className="text-[10px] text-[#6E6E69]">Selected Works Catalog</p>
                        </div>
                      </div>
                      <Download size={14} className="text-[#6E6E69] group-hover:text-[#1345EE] transition-colors shrink-0 ml-2" />
                    </a>
                  )}

                  {profile.long_portfolio_file_url && (
                    <a
                      href={profile.long_portfolio_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F5] hover:bg-[#F2F0ED] border border-[#E8E8E3] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E8E3] flex items-center justify-center text-[#1345EE] shrink-0">
                          <FileText size={15} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-medium text-[#141413] truncate">Monograph / Dossier</p>
                          <p className="text-[10px] text-[#6E6E69]">Comprehensive Archive</p>
                        </div>
                      </div>
                      <Download size={14} className="text-[#6E6E69] group-hover:text-[#1345EE] transition-colors shrink-0 ml-2" />
                    </a>
                  )}

                  {profile.top_artworks_drive_url && (
                    <a
                      href={formatExternalUrl(profile.top_artworks_drive_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F5] hover:bg-[#F2F0ED] border border-[#E8E8E3] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E8E3] flex items-center justify-center text-[#1345EE] shrink-0">
                          <Globe size={15} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-medium text-[#141413] truncate">External Gallery Archive</p>
                          <p className="text-[10px] text-[#6E6E69]">Curated Portfolio Drive</p>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-[#6E6E69] group-hover:text-[#1345EE] transition-colors shrink-0 ml-2" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Card 3: Online & Press Links (If any) */}
            {hasAnyLinks && (
              <div className="bg-white border border-[#E8E8E3] rounded-3xl p-6 shadow-2xs flex flex-col gap-3.5">
                <h3
                  className="text-xs font-semibold tracking-[0.15em] text-[#6E6E69] uppercase pb-2 border-b border-[#F0EFEA]"
                  style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                >
                  Online & Verified Links
                </h3>

                <div className="flex flex-col gap-2">
                  {instagramHandle && (
                    <a
                      href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF9F5] transition-colors group text-xs text-[#141413]"
                    >
                      <div className="flex items-center gap-2.5">
                        <InstagramIcon size={14} className="text-[#E1306C]" />
                        <span className="font-normal truncate">@{instagramHandle.replace('@', '')}</span>
                      </div>
                      <ExternalLink size={13} className="text-[#8A909D] group-hover:text-[#141413] transition-colors" />
                    </a>
                  )}

                  {portfolioLink && (
                    <a
                      href={formatExternalUrl(portfolioLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF9F5] transition-colors group text-xs text-[#141413]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe size={14} className="text-[#1345EE]" />
                        <span className="font-normal truncate">{cleanDisplayUrl(portfolioLink)}</span>
                      </div>
                      <ExternalLink size={13} className="text-[#8A909D] group-hover:text-[#141413] transition-colors" />
                    </a>
                  )}

                  {otherLinksList.map((link, idx) => (
                    <a
                      key={idx}
                      href={formatExternalUrl(link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF9F5] transition-colors group text-xs text-[#141413]"
                    >
                      <div className="flex items-center gap-2.5">
                        <ExternalLink size={14} className="text-gray-500" />
                        <span className="font-normal truncate">{cleanDisplayUrl(link)}</span>
                      </div>
                      <ExternalLink size={13} className="text-[#8A909D] group-hover:text-[#141413] transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Card 4: Action Card (Edit Profile if Owner, Inquire if Visitor) */}
            {isOwner ? (
              <div className="bg-[#FAF9F5] border border-[#E8E8E3] rounded-3xl p-5 shadow-2xs flex flex-col items-center text-center gap-3">
                <p className="text-xs text-[#6E6E69]">
                  Preview mode: This is how collectors and galleries view your public dossier.
                </p>
                <Link
                  href="/profile"
                  className="w-full py-2.5 px-4 rounded-full border border-[#141413] bg-white text-[#141413] hover:bg-[#141413] hover:text-white transition-colors text-xs font-medium text-center flex items-center justify-center gap-1.5"
                >
                  <Pencil size={13} />
                  <span>Edit Profile Dossier</span>
                </Link>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#141413] to-[#252525] text-white rounded-3xl p-6 shadow-md flex flex-col gap-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Acquisitions & Inquiries
                </p>
                <h4
                  className="text-lg font-serif italic font-normal text-white"
                  style={{
                    fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                    fontStyle: 'italic',
                  }}
                >
                  Interested in this artist's work?
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed font-normal">
                  Explore available works and submit an inquiry directly for acquisitions, commissions, or exhibitions.
                </p>
                <button
                  type="button"
                  onClick={() => handleTabChange('works')}
                  className="mt-2 w-full py-2.5 px-4 rounded-full bg-white text-[#141413] hover:bg-gray-100 transition-colors text-xs font-semibold cursor-pointer shadow-xs"
                >
                  View Selected Works
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

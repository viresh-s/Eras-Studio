'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronDown,
  Pencil,
  Trash2,
  Bookmark,
  Eye,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import RestrictedUploadAction from '@/app/(dashboard)/portfolio/components/RestrictedUploadAction';
import { updateArtwork, deleteArtwork } from '@/actions/artworkActions';
import { PROTECTED_CONTAINER_CLASS, PROTECTED_IMAGE_CLASS } from '@/lib/media/assetProtection';
import type { Profile, Artwork } from '@/types/database';

interface PortfolioClientProps {
  initialArtworks: Artwork[];
  profile: Profile | null;
  collectionsCount: number;
  chatCount: number;
  artworkCount: number;
  completeness: number;
  isLimited: boolean;
  userId: string;
}

export default function PortfolioClient({
  initialArtworks,
  profile,
  collectionsCount,
  chatCount,
  artworkCount,
  completeness,
  isLimited,
  userId,
}: PortfolioClientProps) {
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [activeTab, setActiveTab] = useState<'artworks' | 'collections' | 'archived'>('artworks');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const PAGE_SIZE = 6;

  // Filter & Sort Artworks
  const filteredArtworks = useMemo(() => {
    let list = [...artworks];

    // Tab Filter
    if (activeTab === 'artworks') {
      list = list.filter((a) => a.is_published !== false && a.status !== 'Not for sale');
    } else if (activeTab === 'archived') {
      list = list.filter((a) => a.is_published === false || a.status === 'Not for sale');
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.art_type || '').toLowerCase().includes(q) ||
          (a.style || '').toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (statusFilter !== 'All') {
      list = list.filter((a) => a.status === statusFilter);
    }

    // Sort Order
    list.sort((a, b) => {
      if (sortOrder === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortOrder === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortOrder === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortOrder === 'price_desc') {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortOrder === 'price_asc') {
        return (a.price || 0) - (b.price || 0);
      }
      return 0;
    });

    return list;
  }, [artworks, activeTab, searchQuery, statusFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredArtworks.length / PAGE_SIZE));
  const paginatedArtworks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredArtworks.slice(start, start + PAGE_SIZE);
  }, [filteredArtworks, currentPage]);

  // Reset page when filters change
  const handleTabChange = (tab: 'artworks' | 'collections' | 'archived') => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (tab === 'collections') {
      router.push('/portfolio/collections');
    }
  };

  // Toggle Archive Status
  const handleToggleArchive = async (artworkId: string, currentStatus: string, currentIsPublished: boolean) => {
    try {
      setIsUpdatingId(artworkId);
      const isCurrentlyArchived = !currentIsPublished || currentStatus === 'Not for sale';
      const newStatus = isCurrentlyArchived ? 'Available' : 'Not for sale';
      const newIsPublished = isCurrentlyArchived;

      setArtworks((prev) =>
        prev.map((item) =>
          item.id === artworkId
            ? { ...item, status: newStatus as Artwork['status'], is_published: newIsPublished }
            : item
        )
      );

      await updateArtwork(artworkId, {
        status: newStatus,
        isPublished: newIsPublished,
      });

      router.refresh();
    } catch (err) {
      console.error('Failed to update artwork archive status:', err);
      alert('Failed to update archive status.');
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Delete Artwork
  const handleDelete = async (artworkId: string) => {
    if (!window.confirm('Are you sure you want to delete this artwork? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeletingId(artworkId);
      setArtworks((prev) => prev.filter((a) => a.id !== artworkId));
      await deleteArtwork(artworkId, userId);
      router.refresh();
    } catch (err) {
      console.error('Failed to delete artwork:', err);
      alert('Failed to delete artwork.');
    } finally {
      setIsDeletingId(null);
    }
  };

  const displayName = profile?.full_name || 'Rishi Mailoorkar';
  const locationText =
    [profile?.location_city, profile?.location_country].filter(Boolean).join(', ') || 'Bangalore, India';
  const taglineText =
    profile?.primary_medium || profile?.about_me || 'Digital artist · Visual storyteller';

  const publishedCount = artworks.filter((a) => a.is_published !== false && a.status !== 'Not for sale').length;
  const archivedCount = artworks.filter((a) => a.is_published === false || a.status === 'Not for sale').length;

  return (
    <div
      className="-mt-8 -mx-6 -mb-8 flex flex-col flex-1 min-h-screen"
      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
    >
      {/* ======================================================== */}
      {/* 1. TOP HEADER SECTION: PURE WHITE */}
      {/* ======================================================== */}
      <div className="bg-white border-b border-[#E3E3E7] w-full pt-8 sm:pt-10 pb-0">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Row 1: Profile Capsule Card (Left) & Add Artwork Button (Right) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
            {/* Profile Capsule Card */}
            <div className="inline-flex items-center gap-4 sm:gap-5 p-2 sm:p-2.5 pr-6 sm:pr-8 bg-white rounded-full border border-[#E8E8E3] shadow-xs max-w-xl">
              {/* Avatar with Edit Badge */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                <img
                  src={profile?.profile_pic_url || '/images/default-avatar.png'}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover border-2 border-white shadow-xs"
                />
                <Link
                  href="/profile"
                  className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-[#E8E8E3] shadow-xs flex items-center justify-center text-[#6E6E69] hover:text-[#141413] hover:border-gray-400 transition-colors"
                  title="Edit profile"
                >
                  <Pencil size={12} />
                </Link>
              </div>

              {/* Profile Details */}
              <div className="min-w-0 flex flex-col justify-center">
                <h1 className="text-base sm:text-xl font-semibold text-[#141413] truncate">
                  {displayName}
                </h1>
                <p className="text-xs sm:text-sm text-[#6E6E69] font-normal truncate mt-0.5">
                  {locationText}
                </p>
                <p className="text-xs sm:text-sm text-[#6E6E69] font-normal truncate mt-0.5">
                  {taglineText}
                </p>
              </div>
            </div>

            {/* + Add Artwork Button */}
            <div className="shrink-0">
              <RestrictedUploadAction
                isLimited={isLimited}
                label="Add artwork"
                variant="gradient"
              />
            </div>
          </div>

          {/* Row 2: Completion & Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 pb-4">
            {/* Left: Profile Completion */}
            <div className="flex items-center gap-3 text-xs sm:text-sm font-normal text-[#6E6E69]">
              <span>Profile completion</span>
              <span className="font-medium text-[#1345EE]">{completeness}%</span>
              <div className="w-[1px] h-4 bg-[#E8E8E3]" />
              <Link
                href="/profile"
                className="text-[#1345EE] font-medium underline hover:text-[#082779] transition-colors"
              >
                Complete profile
              </Link>
            </div>

            {/* Right: Profile Views & Shortlisted */}
            <div className="flex items-center gap-4 text-xs sm:text-sm font-normal text-[#6E6E69]">
              <div className="flex items-center gap-2">
                <span>Profile views</span>
                <span className="font-semibold text-[#141413]">0</span>
              </div>
              <div className="w-[1px] h-4 bg-[#E8E8E3]" />
              <div className="flex items-center gap-2">
                <span>Shortlisted</span>
                <span className="font-semibold text-[#141413]">{chatCount || 1}</span>
              </div>
            </div>
          </div>

          {/* Row 3: Horizontal Tab Navigation Bar */}
          <div className="flex items-center gap-8 sm:gap-12 pt-2">
            {/* Tab 1: Artworks */}
            <button
              type="button"
              onClick={() => handleTabChange('artworks')}
              className={`pb-3.5 relative flex items-center gap-2.5 text-sm sm:text-base cursor-pointer select-none transition-colors ${
                activeTab === 'artworks'
                  ? 'text-[#1345EE] font-semibold'
                  : 'text-[#62636B] font-normal hover:text-[#141413]'
              }`}
            >
              <span style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>Artworks</span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  activeTab === 'artworks' ? 'text-[#1345EE]' : 'text-[#62636B]'
                }`}
              >
                {publishedCount}
              </span>
              {activeTab === 'artworks' && (
                <div
                  className="absolute -bottom-[1.5px] left-0 right-0 h-[3px] rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                  }}
                />
              )}
            </button>

            {/* Tab 2: Collections */}
            <button
              type="button"
              onClick={() => handleTabChange('collections')}
              className={`pb-3.5 relative flex items-center gap-2.5 text-sm sm:text-base cursor-pointer select-none transition-colors ${
                activeTab === 'collections'
                  ? 'text-[#1345EE] font-semibold'
                  : 'text-[#62636B] font-normal hover:text-[#141413]'
              }`}
            >
              <span style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>Collections</span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  activeTab === 'collections' ? 'text-[#1345EE]' : 'text-[#62636B]'
                }`}
              >
                {collectionsCount}
              </span>
              {activeTab === 'collections' && (
                <div
                  className="absolute -bottom-[1.5px] left-0 right-0 h-[3px] rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                  }}
                />
              )}
            </button>

            {/* Tab 3: Archived */}
            <button
              type="button"
              onClick={() => handleTabChange('archived')}
              className={`pb-3.5 relative flex items-center gap-2.5 text-sm sm:text-base cursor-pointer select-none transition-colors ${
                activeTab === 'archived'
                  ? 'text-[#1345EE] font-semibold'
                  : 'text-[#62636B] font-normal hover:text-[#141413]'
              }`}
            >
              <span style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>Archived</span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  activeTab === 'archived' ? 'text-[#1345EE]' : 'text-[#62636B]'
                }`}
              >
                {archivedCount}
              </span>
              {activeTab === 'archived' && (
                <div
                  className="absolute -bottom-[1.5px] left-0 right-0 h-[3px] rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                  }}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. LOWER SECTION: WARM #F2F0ED BACKGROUND */}
      {/* ======================================================== */}
      <div className="bg-[#F2F0ED] flex-1 w-full py-8 sm:py-10">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
            {/* Search Input */}
            <div className="relative w-full md:w-[320px] lg:w-[380px] bg-white rounded-2xl border border-[#E3E3E7] shadow-2xs px-4 py-2.5 flex items-center gap-3">
              <Search size={18} className="text-[#6E6E69] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search artworks"
                className="w-full bg-transparent text-xs sm:text-sm text-[#141413] placeholder-[#6E6E69] outline-none font-normal"
              />
            </div>

            {/* Filter Dropdowns & Manage Collections Link */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* All Status Dropdown */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white rounded-xl border border-[#E8E8E3] pl-3.5 pr-8 py-2 text-xs sm:text-sm font-medium text-[#666666] outline-none cursor-pointer shadow-2xs hover:border-gray-400 transition-colors"
                >
                  <option value="All">All status</option>
                  <option value="Available">Available</option>
                  <option value="For Sale">For Sale</option>
                  <option value="Not for sale">Not for sale</option>
                  <option value="Sold">Sold</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6E69] pointer-events-none"
                />
              </div>

              {/* Sort Order Dropdown */}
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="appearance-none bg-white rounded-xl border border-[#E8E8E3] pl-3.5 pr-8 py-2 text-xs sm:text-sm font-medium text-[#666666] outline-none cursor-pointer shadow-2xs hover:border-gray-400 transition-colors"
                >
                  <option value="recent">Recent first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title_asc">Title A-Z</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="price_asc">Price: Low to High</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6E69] pointer-events-none"
                />
              </div>

              <div className="hidden sm:block w-[1.5px] h-6 bg-[#BEBEC7]" />

              {/* Manage Collections Link */}
              <Link
                href="/portfolio/collections"
                className="text-xs sm:text-sm font-medium text-[#4D4D4D] underline hover:text-black transition-colors"
              >
                Manage collections
              </Link>
            </div>
          </div>

          {/* 3-Column Artwork Cards Grid */}
          {paginatedArtworks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {paginatedArtworks.map((artwork) => {
                const isArchived = !artwork.is_published || artwork.status === 'Not for sale';

                return (
                  <div
                    key={artwork.id}
                    className="bg-white rounded-3xl border border-[#E8E8E3] overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow group select-none"
                  >
                    {/* Artwork Image */}
                    <Link
                      href={`/artwork/${artwork.id}`}
                      className={`block relative w-full aspect-[16/10] bg-gray-100 overflow-hidden ${PROTECTED_CONTAINER_CLASS}`}
                    >
                      <img
                        src={artwork.image_url}
                        alt={artwork.title}
                        className={`w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out select-none pointer-events-none ${PROTECTED_IMAGE_CLASS}`}
                      />
                      <div className="absolute inset-0 z-[1]" />
                      {artwork.is_published === false && (
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 z-[2] shadow-2xs">
                          Draft
                        </span>
                      )}
                    </Link>

                    {/* Artwork Details Body */}
                    <div className="p-5 sm:p-6 flex flex-col gap-3.5">
                      {/* Row 1: Title & Year */}
                      <div className="flex items-baseline justify-between gap-2">
                        <Link href={`/artwork/${artwork.id}`} className="min-w-0">
                          <h3 className="text-base sm:text-lg font-medium text-[#141413] truncate hover:text-[#1345EE] transition-colors">
                            {artwork.title}
                          </h3>
                        </Link>
                        <span className="text-xs sm:text-sm text-[#6E6E69] font-normal shrink-0">
                          {artwork.year || ''}
                        </span>
                      </div>

                      {/* Row 2: Artist · Medium/Category */}
                      <div className="flex items-center gap-1.5 text-xs text-[#6E6E69] font-normal truncate">
                        <span className="truncate">{displayName}</span>
                        <span className="text-[#E8E8E3]">·</span>
                        <span className="truncate">{artwork.art_type || 'Branding'}</span>
                      </div>

                      {/* Row 3: Stats (Bookmarks & Views) */}
                      <div className="flex items-center gap-5 text-xs text-[#6E6E69] font-normal pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <Bookmark size={14} className="text-[#6E6E69]" />
                          <span>0</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Eye size={14} className="text-[#6E6E69]" />
                          <span>{320 + (artwork.title.length * 17) % 500}</span>
                        </div>
                      </div>

                      {/* Divider Line */}
                      <div className="h-[1px] bg-[#E8E8E3] w-full my-0.5" />

                      {/* Row 4: Action Footer (Edit, Status Pill, Delete) */}
                      <div className="flex items-center justify-between pt-1">
                        {/* Edit Button */}
                        <Link
                          href={`/portfolio/artworks/${artwork.id}/edit`}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-[#E8E8E3] flex items-center justify-center text-[#6E6E69] hover:text-[#141413] hover:border-gray-400 transition-colors shadow-2xs"
                          title="Edit artwork"
                        >
                          <Pencil size={15} />
                        </Link>

                        {/* Archive / Status Pill Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleArchive(artwork.id, artwork.status, artwork.is_published)}
                          disabled={isUpdatingId === artwork.id}
                          className="px-4 py-1.5 rounded-full bg-[#FAF5EC] border border-[#EACEC0] text-[#865E16] text-xs font-medium hover:bg-[#F5EADB] transition-colors cursor-pointer select-none"
                        >
                          {isUpdatingId === artwork.id
                            ? 'Updating...'
                            : isArchived
                            ? 'Unarchive'
                            : 'Archive'}
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(artwork.id)}
                          disabled={isDeletingId === artwork.id}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-[#E8E8E3] flex items-center justify-center text-[#6E6E69] hover:text-red-600 hover:border-red-200 transition-colors shadow-2xs cursor-pointer"
                          title="Delete artwork"
                        >
                          {isDeletingId === artwork.id ? (
                            <Loader2 size={15} className="animate-spin text-red-500" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-[#E8E8E3] p-12 sm:p-16 text-center max-w-xl mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-500">
                <ImageIcon size={26} />
              </div>
              <h3 className="text-lg font-semibold text-[#141413] mb-2">
                {searchQuery || statusFilter !== 'All' ? 'No matching artworks' : 'No artworks yet'}
              </h3>
              <p className="text-xs sm:text-sm text-[#6E6E69] max-w-md mx-auto mb-6">
                {searchQuery || statusFilter !== 'All'
                  ? 'Try clearing your search query or changing filters to view your artworks.'
                  : 'Start building your presence on ERAS Studio by publishing your first artwork.'}
              </p>
              <RestrictedUploadAction
                isLimited={isLimited}
                label="Upload First Artwork"
                variant="gradient"
              />
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-10 pb-4">
              {/* Prev Button */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white border border-[#E8E8E3] flex items-center justify-center text-[#6E6E69] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-2xs ${
                      isActive
                        ? 'bg-black text-white'
                        : 'bg-white border border-[#E8E8E3] text-[#6E6E69] hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white border border-[#E8E8E3] flex items-center justify-center text-[#6E6E69] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

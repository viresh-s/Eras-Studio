'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronDown,
  Pencil,
  Trash2,
  Heart,
  Eye,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Image as ImageIcon,
  Folder,
  Layers,
} from 'lucide-react';
import RestrictedUploadAction from '@/app/(dashboard)/portfolio/components/RestrictedUploadAction';
import { updateArtwork, deleteArtwork } from '@/actions/artworkActions';
import { CollectionItem, deleteCollection } from '@/actions/collectionActions';
import { PROTECTED_CONTAINER_CLASS, PROTECTED_IMAGE_CLASS } from '@/lib/media/assetProtection';
import type { Profile, Artwork } from '@/types/database';

interface PortfolioClientProps {
  initialArtworks: Artwork[];
  initialCollections?: CollectionItem[];
  profile: Profile | null;
  collectionsCount: number;
  chatCount: number;
  artworkCount: number;
  completeness: number;
  isLimited: boolean;
  userId: string;
  profileViews?: number;
}

export default function PortfolioClient({
  initialArtworks,
  initialCollections = [],
  profile,
  collectionsCount,
  chatCount,
  artworkCount,
  completeness,
  isLimited,
  userId,
  profileViews = 0,
}: PortfolioClientProps) {
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [collectionsList, setCollectionsList] = useState<CollectionItem[]>(initialCollections);
  const [activeTab, setActiveTab] = useState<'artworks' | 'collections' | 'archived'>('artworks');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const PAGE_SIZE = 3;

  // Filter & Sort Artworks
  const filteredArtworks = useMemo(() => {
    let list = [...artworks];

    // Tab Filter
    if (activeTab === 'artworks') {
      list = list.filter((a) => a.is_published !== false);
    } else if (activeTab === 'archived') {
      list = list.filter((a) => a.is_published === false);
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
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        return priceB - priceA;
      }
      if (sortOrder === 'price_asc') {
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        return priceA - priceB;
      }
      return 0;
    });

    return list;
  }, [artworks, activeTab, searchQuery, statusFilter, sortOrder]);

  // Filter & Sort Collections
  const filteredCollections = useMemo(() => {
    let list = [...collectionsList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
      );
    }

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
      return 0;
    });

    return list;
  }, [collectionsList, searchQuery, sortOrder]);

  const activeTotalItems =
    activeTab === 'collections' ? filteredCollections.length : filteredArtworks.length;
  const totalPages = Math.max(1, Math.ceil(activeTotalItems / PAGE_SIZE));

  const paginatedArtworks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredArtworks.slice(start, start + PAGE_SIZE);
  }, [filteredArtworks, currentPage]);

  const paginatedCollections = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCollections.slice(start, start + PAGE_SIZE);
  }, [filteredCollections, currentPage]);

  // Keep currentPage within bounds when items or totalPages change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Dynamic page numbers for pagination (e.g. 1, 2, 3, 4... or with ellipsis)
  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  // Reset page when filters change
  const handleTabChange = (tab: 'artworks' | 'collections' | 'archived') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery('');
  };

  // Delete Collection
  const handleDeleteCollection = async (col: CollectionItem) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the collection "${col.title}"? Your artworks will remain intact and will simply be unassigned from this collection.`
      )
    ) {
      return;
    }

    try {
      setIsDeletingId(col.id);
      setCollectionsList((prev) => prev.filter((c) => c.id !== col.id));
      await deleteCollection(col.id);
      router.refresh();
    } catch (err) {
      console.error('Failed to delete collection:', err);
      alert('Failed to delete collection.');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Toggle Archive Status
  const handleToggleArchive = async (artworkId: string, currentStatus: string, currentIsPublished: boolean) => {
    try {
      setIsUpdatingId(artworkId);
      const isCurrentlyArchived = !currentIsPublished;
      const newIsPublished = !currentIsPublished;

      setArtworks((prev) =>
        prev.map((item) =>
          item.id === artworkId
            ? { ...item, is_published: newIsPublished }
            : item
        )
      );

      await updateArtwork(artworkId, {
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

  const publishedCount = artworks.filter((a) => a.is_published !== false).length;
  const archivedCount = artworks.filter((a) => a.is_published === false).length;

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
            {/* Profile Card matching exact Figma specs */}
            <div
              className="inline-flex items-center gap-4 sm:gap-6 p-3 sm:p-3.5 pr-8 sm:pr-10 bg-white border border-[#E8E8E3] shadow-xs max-w-xl transition-shadow select-none"
              style={{ borderRadius: 20 }}
            >
              {/* Avatar with Progress Arc & Edit Badge */}
              <div className="relative w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] shrink-0 flex items-center justify-center">
                {/* Dynamic conic completion ring around avatar (18% arc as shown in reference) */}
                <div
                  className="w-full h-full rounded-full p-[2.5px] flex items-center justify-center"
                  style={{
                    background: `conic-gradient(from 0deg, #082779 0%, #1345EE ${Math.max(completeness, 5) * 3.6 * 0.6}deg, #458CFF ${Math.max(completeness, 5) * 3.6}deg, #E8E8E3 ${Math.max(completeness, 5) * 3.6}deg, #E8E8E3 360deg)`,
                  }}
                >
                  <div className="w-full h-full rounded-full bg-white p-[2px]">
                    <img
                      src={profile?.profile_pic_url || '/images/default-avatar.png'}
                      alt={displayName}
                      className="w-full h-full rounded-full object-cover select-none pointer-events-none"
                    />
                  </div>
                </div>

                {/* Edit Badge Button */}
                <Link
                  href="/profile"
                  className="absolute -bottom-1 -right-1 w-[26px] h-[30px] sm:w-[28px] sm:h-[32px] bg-white border border-[#E8E8E3] shadow-[0px_8px_20px_-8px_rgba(0,0,0,0.08)] flex items-center justify-center text-[#6E6E69] hover:text-[#141413] hover:border-gray-400 transition-colors z-10"
                  style={{ borderRadius: 8 }}
                  title="Edit profile"
                >
                  <Pencil size={13} className="text-[#6E6E69]" />
                </Link>
              </div>

              {/* Profile Details */}
              <div className="min-w-0 flex flex-col justify-center gap-1">
                <h1
                  className="text-xl sm:text-[22px] font-semibold text-[#141413] truncate tracking-normal"
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    lineHeight: '28px',
                  }}
                >
                  {displayName}
                </h1>
                <p
                  className="text-xs sm:text-[13px] text-[#6E6E69] font-normal truncate"
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    lineHeight: '18px',
                  }}
                >
                  {locationText}
                </p>
                <p
                  className="text-xs sm:text-[13px] text-[#6E6E69] font-normal truncate"
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    lineHeight: '18px',
                  }}
                >
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
                <span className="font-semibold text-[#141413]">{profileViews}</span>
              </div>
              <div className="w-[1px] h-4 bg-[#E8E8E3]" />
              <div className="flex items-center gap-2">
                <span>Shortlisted</span>
                <span className="font-semibold text-[#141413]">{chatCount || 0}</span>
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
                {collectionsList.length}
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
            <div
              className="relative w-full md:w-[320px] lg:w-[380px] px-3.5 py-2.5 flex items-center gap-2.5 shadow-2xs input-gradient-border-sm"
            >
              <Search size={16} className="text-[#6E6E69] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={activeTab === 'collections' ? 'Search collections' : 'Search artworks'}
                className="w-full bg-transparent text-xs sm:text-sm text-[#141413] placeholder-[#6E6E69] outline-none font-normal"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              />
            </div>

            {/* Filter Dropdowns & Manage Collections Link */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* All Status Dropdown (Artworks only) */}
              {activeTab !== 'collections' && (
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="appearance-none pl-3.5 pr-8 py-2.5 text-xs sm:text-sm font-normal text-[#141413] outline-none cursor-pointer shadow-2xs input-gradient-border-sm"
                    style={{
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    }}
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
              )}

              {/* Sort Order Dropdown */}
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none pl-3.5 pr-8 py-2.5 text-xs sm:text-sm font-normal text-[#141413] outline-none cursor-pointer shadow-2xs input-gradient-border-sm"
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  }}
                >
                  <option value="recent">Recent first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title_asc">Title A-Z</option>
                  {activeTab !== 'collections' && (
                    <>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="price_asc">Price: Low to High</option>
                    </>
                  )}
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

          {/* ======================================================== */}
          {/* TAB CONTENT: COLLECTIONS VS ARTWORKS                      */}
          {/* ======================================================== */}
          {activeTab === 'collections' ? (
            /* 3-Column Collections Grid */
            filteredCollections.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {paginatedCollections.map((col) => {
                  return (
                    <div
                      key={col.id}
                      className="bg-white border border-[#E8E8E3] overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow group select-none"
                      style={{ borderRadius: 14 }}
                    >
                      {/* Collection Cover Image */}
                      <Link
                        href="/portfolio/collections"
                        className="block relative w-full aspect-[16/10.5] bg-gray-100 overflow-hidden cursor-pointer"
                      >
                        {col.cover_image_url ? (
                          <img
                            src={col.cover_image_url}
                            alt={col.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out select-none pointer-events-none"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FAFAF8] to-[#ECEAE5] text-[#6E6E69] gap-2">
                            <Folder size={36} className="opacity-40 text-[#6E6E69]" />
                            <span className="text-[12px] font-normal text-[#6E6E69]">Curated Collection</span>
                          </div>
                        )}
                        <div className="absolute inset-0 z-[1]" />
                        {col.is_published === false && (
                          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 z-[2] shadow-2xs">
                            Draft
                          </span>
                        )}

                        {/* Artwork Count Badge */}
                        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs z-[2]">
                          <Layers size={12} />
                          <span>
                            {col.artwork_count || 0} {col.artwork_count === 1 ? 'Artwork' : 'Artworks'}
                          </span>
                        </div>
                      </Link>

                      {/* Collection Details Body */}
                      <div className="p-4 sm:p-5 flex flex-col gap-3">
                        {/* Row 1: Title & Year */}
                        <div className="flex items-center justify-between gap-2">
                          <Link href="/portfolio/collections" className="min-w-0">
                            <h3
                              className="text-[16px] sm:text-[17px] font-medium text-[#141413] truncate hover:text-[#1345EE] transition-colors"
                              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                            >
                              {col.title}
                            </h3>
                          </Link>
                          <span
                            className="text-[11px] sm:text-xs text-[#6E6E69] font-normal shrink-0"
                            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                          >
                            {col.created_at ? new Date(col.created_at).getFullYear() : 2025}
                          </span>
                        </div>

                        {/* Row 2: Creator Name · Type */}
                        <div
                          className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#6E6E69] font-normal truncate"
                          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                        >
                          <span className="truncate">{displayName}</span>
                          <span className="text-[#E8E8E3]">·</span>
                          <span className="truncate">Collection</span>
                        </div>

                        {/* Row 3: Description / Statement */}
                        <p
                          className="text-[11px] sm:text-xs text-[#6E6E69] line-clamp-1 truncate"
                          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                        >
                          {col.description || `${col.artwork_count || 0} curated works in this series`}
                        </p>

                        {/* Divider Line */}
                        <div className="h-[1px] bg-[#E8E8E3] w-full my-0.5" />

                        {/* Row 4: Action Footer (Edit + Manage on Left, Delete on Right) */}
                        <div className="flex items-center justify-between pt-0.5">
                          {/* Left Group */}
                          <div className="flex items-center gap-2">
                            {/* Edit on Collections Page */}
                            <Link
                              href="/portfolio/collections"
                              className="w-8 h-9 sm:w-[32px] sm:h-[34px] bg-white border border-[#E8E8E3] flex items-center justify-center text-[#6E6E69] hover:text-[#141413] hover:border-gray-400 transition-colors shadow-2xs"
                              style={{ borderRadius: 8 }}
                              title="Edit collection"
                            >
                              <Pencil size={14} className="text-[#6E6E69]" />
                            </Link>

                            {/* Manage Artworks Pill */}
                            <Link
                              href="/portfolio/collections"
                              className="h-9 sm:h-[34px] px-3.5 sm:px-4 rounded-full bg-[#FAF5EC] border border-[#EACEC0] text-[#865E16] text-[11px] sm:text-xs font-medium hover:bg-[#F5EADB] transition-colors cursor-pointer select-none flex items-center justify-center"
                              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                            >
                              Manage Artworks
                            </Link>
                          </div>

                          {/* Right Group: Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCollection(col)}
                            disabled={isDeletingId === col.id}
                            className="w-8 h-9 sm:w-[32px] sm:h-[34px] bg-white border border-[#E8E8E3] flex items-center justify-center text-[#6E6E69] hover:text-red-600 hover:border-red-200 transition-colors shadow-2xs cursor-pointer ml-auto"
                            style={{ borderRadius: 8 }}
                            title="Delete collection"
                          >
                            {isDeletingId === col.id ? (
                              <Loader2 size={14} className="animate-spin text-red-500" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Collections Empty State */
              <div className="bg-white rounded-3xl border border-[#E8E8E3] p-12 sm:p-16 text-center max-w-xl mx-auto shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-500">
                  <Folder size={26} />
                </div>
                <h3 className="text-lg font-semibold text-[#141413] mb-2">
                  {searchQuery ? 'No matching collections' : 'No collections yet'}
                </h3>
                <p className="text-xs sm:text-sm text-[#6E6E69] max-w-md mx-auto mb-6">
                  {searchQuery
                    ? 'Try clearing your search query or check back later.'
                    : 'Organize and curate your artworks into thematic series or exhibition drops.'}
                </p>
                <Link
                  href="/portfolio/collections"
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
                  className="px-6 py-2.5 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98] select-none text-white text-xs font-medium shadow-md"
                >
                  <Plus size={14} />
                  <span>Create Collection</span>
                </Link>
              </div>
            )
          ) : filteredArtworks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {paginatedArtworks.map((artwork) => {
                  const isArchived = !artwork.is_published || artwork.status === 'Not for sale';

                  return (
                    <div
                      key={artwork.id}
                      className="bg-white border border-[#E8E8E3] overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow group select-none"
                      style={{ borderRadius: 14 }}
                    >
                      {/* Artwork Image */}
                      <Link
                        href={`/artwork/${artwork.id}`}
                        className={`block relative w-full aspect-[16/10.5] bg-gray-100 overflow-hidden ${PROTECTED_CONTAINER_CLASS}`}
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
                      <div className="p-4 sm:p-5 flex flex-col gap-3">
                        {/* Row 1: Title & Year */}
                        <div className="flex items-center justify-between gap-2">
                          <Link href={`/artwork/${artwork.id}`} className="min-w-0">
                            <h3
                              className="text-[16px] sm:text-[17px] font-medium text-[#141413] truncate hover:text-[#1345EE] transition-colors"
                              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                            >
                              {artwork.title}
                            </h3>
                          </Link>
                          <span
                            className="text-[11px] sm:text-xs text-[#6E6E69] font-normal shrink-0"
                            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                          >
                            {artwork.year || ''}
                          </span>
                        </div>

                        {/* Row 2: Artist · Medium/Category */}
                        <div
                          className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#6E6E69] font-normal truncate"
                          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                        >
                          <span className="truncate">{displayName}</span>
                          <span className="text-[#E8E8E3]">·</span>
                          <span className="truncate">{artwork.art_type || 'Branding'}</span>
                        </div>

                        {/* Row 3: Stats (Heart & Views) */}
                        <div
                          className="flex items-center gap-4 text-[11px] sm:text-xs text-[#6E6E69] font-normal pt-0.5"
                          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                        >
                          <div className="flex items-center gap-1" title={`${artwork.likes_count || 0} likes`}>
                            <Heart size={13} className="text-[#6E6E69]" strokeWidth={1.75} />
                            <span>{artwork.likes_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1" title={`${artwork.views_count || 0} views`}>
                            <Eye size={13} className="text-[#6E6E69]" strokeWidth={1.75} />
                            <span>{artwork.views_count || 0}</span>
                          </div>
                        </div>

                        {/* Divider Line */}
                        <div className="h-[1px] bg-[#E8E8E3] w-full my-0.5" />

                        {/* Row 4: Action Footer (Edit + Archive on Left, Delete on Right) */}
                        <div className="flex items-center justify-between pt-0.5">
                          {/* Left Group: Edit & Archive Button */}
                          <div className="flex items-center gap-2">
                            {/* Edit Button */}
                            <Link
                              href={`/portfolio/artworks/${artwork.id}/edit`}
                              className="w-8 h-9 sm:w-[32px] sm:h-[34px] bg-white border border-[#E8E8E3] flex items-center justify-center text-[#6E6E69] hover:text-[#141413] hover:border-gray-400 transition-colors shadow-2xs"
                              style={{ borderRadius: 8 }}
                              title="Edit artwork"
                            >
                              <Pencil size={14} className="text-[#6E6E69]" />
                            </Link>

                            {/* Archive / Status Pill Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleArchive(artwork.id, artwork.status, artwork.is_published)}
                              disabled={isUpdatingId === artwork.id}
                              className="h-9 sm:h-[34px] px-3.5 sm:px-4 rounded-full bg-[#FAF5EC] border border-[#EACEC0] text-[#865E16] text-[11px] sm:text-xs font-medium hover:bg-[#F5EADB] transition-colors cursor-pointer select-none flex items-center justify-center"
                              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                            >
                              {isUpdatingId === artwork.id
                                ? 'Updating...'
                                : isArchived
                                ? 'Unarchive'
                                : 'Archive'}
                            </button>
                          </div>

                          {/* Right Group: Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(artwork.id)}
                            disabled={isDeletingId === artwork.id}
                            className="w-8 h-9 sm:w-[32px] sm:h-[34px] bg-white border border-[#E8E8E3] flex items-center justify-center text-[#6E6E69] hover:text-red-600 hover:border-red-200 transition-colors shadow-2xs cursor-pointer ml-auto"
                            style={{ borderRadius: 8 }}
                            title="Delete artwork"
                          >
                            {isDeletingId === artwork.id ? (
                              <Loader2 size={14} className="animate-spin text-red-500" />
                            ) : (
                              <Trash2 size={14} />
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
          {activeTotalItems > 0 && (
            <div className="flex items-center justify-center gap-3 pt-12 pb-4 select-none">
              {/* Prev Button */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-white border border-[#E8E8E3] flex items-center justify-center text-[#6E6E69] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer"
                style={{ borderRadius: 12 }}
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Page Number Buttons */}
              {visiblePages.map((pageItem, idx) => {
                if (typeof pageItem === 'string') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-8 h-10 sm:w-8 sm:h-11 flex items-center justify-center text-xs sm:text-sm text-[#6E6E69] select-none"
                    >
                      ...
                    </span>
                  );
                }

                const isActive = pageItem === currentPage;
                return (
                  <button
                    key={pageItem}
                    type="button"
                    onClick={() => setCurrentPage(pageItem)}
                    className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-xs sm:text-sm font-medium transition-all cursor-pointer shadow-2xs ${
                      isActive
                        ? 'bg-black text-white'
                        : 'bg-white border border-[#E8E8E3] text-[#6E6E69] hover:text-black hover:bg-gray-50'
                    }`}
                    style={{
                      borderRadius: 12,
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    }}
                  >
                    {pageItem}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-white border border-[#E8E8E3] flex items-center justify-center text-[#6E6E69] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer"
                style={{ borderRadius: 12 }}
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

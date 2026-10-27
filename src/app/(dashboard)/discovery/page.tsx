'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createChatSession } from '@/actions/chatActions';
import TopCreatorsRow from '@/components/features/discovery/TopCreatorsRow';
import { getTopCreators, RankedCreator } from '@/lib/services/rankingService';
import { PROTECTED_CONTAINER_CLASS, PROTECTED_IMAGE_CLASS } from '@/lib/media/assetProtection';

const categoryPills = [
  { value: '', label: 'All works' },
  { value: 'Painting', label: 'Painting' },
  { value: 'Sculpture', label: 'Sculpture' },
  { value: 'Photography', label: 'Photography' },
  { value: 'Digital Art', label: 'Digital Art' },
  { value: 'Illustration', label: 'Illustration' },
  { value: 'Mixed Media', label: 'Mixed Media' },
];

const sortOptions = [
  { value: 'recommended', label: 'Recommended for you' },
  { value: 'newest', label: 'Recently added' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

interface ArtworkItem {
  id: string;
  creator_id: string;
  title: string;
  art_type: string;
  artist_name: string;
  image_url: string;
  price: number | null;
  price_visibility?: string | null;
  status: string;
  year?: string | null;
  profiles: { full_name: string; profile_pic_url?: string | null } | null;
}

const getInitials = (name: string) => {
  if (!name) return 'A';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

// Module-level cache for default view (eliminates blank skeleton flash on navigation)
let cachedDefaultArtworks: ArtworkItem[] | null = null;
let cachedHasMore: boolean = true;

export default function BrowsePage() {
  const router = useRouter();
  const [artworks, setArtworks] = useState<ArtworkItem[]>(() => cachedDefaultArtworks || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [artTypeFilter, setArtTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under10k' | '10k-50k' | '50kPlus' | 'on_request'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(() => !cachedDefaultArtworks || cachedDefaultArtworks.length === 0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(() => cachedHasMore);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [requestedArtworkIds, setRequestedArtworkIds] = useState<Set<string>>(new Set());
  const [topCreators, setTopCreators] = useState<RankedCreator[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(false);

  // Modal State for "Price on request"
  const [selectedArtworkForPrice, setSelectedArtworkForPrice] = useState<ArtworkItem | null>(null);
  const [priceRequestMessage, setPriceRequestMessage] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 16;
  const isInitialMount = useRef(true);

  // Load user, previous requests, and dynamic top creators on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        const { data: userChats } = await supabase
          .from('inquiries_chats')
          .select('artwork_id')
          .eq('guest_id', user.id);
        if (userChats) {
          setRequestedArtworkIds(new Set(userChats.map((c: any) => c.artwork_id)));
        }
      }
    });

    // Real-time Top Creators Ranking (cached after first fetch)
    setIsLoadingCreators(true);
    getTopCreators(10)
      .then((data) => setTopCreators(data))
      .catch((err) => console.error('Failed to load top creators:', err))
      .finally(() => setIsLoadingCreators(false));
  }, []);

  const fetchArtworks = async (targetPage = 1, isReset = false) => {
    // Only show skeleton spinner if we don't have items to display
    if (isReset && (!cachedDefaultArtworks || cachedDefaultArtworks.length === 0)) {
      setIsLoading(true);
    }
    const supabase = createClient();

    let query = supabase
      .from('artworks')
      .select('id, creator_id, title, art_type, artist_name, image_url, price, price_visibility, status, year, created_at, profiles(full_name, profile_pic_url)', { count: 'exact' })
      .eq('status', 'Available');

    // Sorting
    if (sortBy === 'price_asc') {
      query = query.order('price', { ascending: true, nullsFirst: false });
    } else if (sortBy === 'price_desc') {
      query = query.order('price', { ascending: false, nullsFirst: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Search query on title and artist_name
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      query = query.or(`title.ilike.%${q}%,artist_name.ilike.%${q}%`);
    }

    // Category / medium filter
    if (artTypeFilter) {
      query = query.eq('art_type', artTypeFilter);
    }

    // Price filter
    if (priceFilter === 'on_request') {
      query = query.eq('price_visibility', 'Price on Request');
    } else if (priceFilter === 'under10k') {
      query = query.lte('price', 10000).neq('price_visibility', 'Price on Request');
    } else if (priceFilter === '10k-50k') {
      query = query.gte('price', 10000).lte('price', 50000).neq('price_visibility', 'Price on Request');
    } else if (priceFilter === '50kPlus') {
      query = query.gte('price', 50000).neq('price_visibility', 'Price on Request');
    }

    // Apply pagination range
    const from = (targetPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, count } = await query;

    if (data) {
      let finalArtworks = data as any[];

      // Dynamic Artwork Scoring for "Recommended for you"
      if (sortBy === 'recommended' && finalArtworks.length > 0) {
        try {
          const artworkIds = finalArtworks.map((a: any) => a.id);
          const [{ data: saves }, { data: inqs }] = await Promise.all([
            (supabase as any).from('saved_artworks').select('artwork_id').in('artwork_id', artworkIds),
            (supabase as any).from('inquiries_chats').select('artwork_id').in('artwork_id', artworkIds),
          ]);

          const saveMap = new Map<string, number>();
          ((saves as any[]) || []).forEach((s: any) => saveMap.set(s.artwork_id, (saveMap.get(s.artwork_id) || 0) + 1));

          const inqMap = new Map<string, number>();
          ((inqs as any[]) || []).forEach((i: any) => inqMap.set(i.artwork_id, (inqMap.get(i.artwork_id) || 0) + 1));

          finalArtworks = [...finalArtworks].sort((a: any, b: any) => {
            const aSaves = saveMap.get(a.id) || 0;
            const bSaves = saveMap.get(b.id) || 0;
            const aInqs = inqMap.get(a.id) || 0;
            const bInqs = inqMap.get(b.id) || 0;

            const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
            const aAgeDays = (Date.now() - aDate) / (1000 * 60 * 60 * 24);
            const bAgeDays = (Date.now() - bDate) / (1000 * 60 * 60 * 24);

            const aFreshness = aAgeDays <= 7 ? 20 : aAgeDays <= 14 ? 10 : aAgeDays <= 30 ? 5 : 0;
            const bFreshness = bAgeDays <= 7 ? 20 : bAgeDays <= 14 ? 10 : bAgeDays <= 30 ? 5 : 0;

            const aScore = (aInqs * 10) + (aSaves * 6) + aFreshness;
            const bScore = (bInqs * 10) + (bSaves * 6) + bFreshness;

            if (bScore !== aScore) return bScore - aScore;
            return bDate - aDate;
          });
        } catch (err) {
          console.error('Error dynamic ranking artworks:', err);
        }
      }

      const isDefaultView = !searchQuery && !artTypeFilter && sortBy === 'recommended' && priceFilter === 'all';
      const calculatedHasMore = count !== null ? from + data.length < count : data.length === ITEMS_PER_PAGE;

      if (isReset) {
        setArtworks(finalArtworks as unknown as ArtworkItem[]);
        if (isDefaultView) {
          cachedDefaultArtworks = finalArtworks as unknown as ArtworkItem[];
          cachedHasMore = calculatedHasMore;
        }
      } else {
        setArtworks(prev => {
          const newArtworks = finalArtworks as unknown as ArtworkItem[];
          const existingIds = new Set(prev.map(a => a.id));
          const uniqueNewArtworks = newArtworks.filter(a => !existingIds.has(a.id));
          return [...prev, ...uniqueNewArtworks];
        });
      }

      setHasMore(calculatedHasMore);
    }
    setIsLoading(false);
  };

  // Fetch when page changes or filters change (without duplicate mount triggers)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchArtworks(1, true);
      return;
    }

    setPage(1);
    fetchArtworks(1, true);
  }, [searchQuery, artTypeFilter, sortBy, priceFilter]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchArtworks(nextPage, false);
  };

  const handleOpenPriceRequest = (artwork: ArtworkItem) => {
    if (!currentUser) {
      router.push(`/login?returnUrl=/artwork/${artwork.id}`);
      return;
    }

    // If own artwork, navigate to it instead
    if (currentUser.id === artwork.creator_id) {
      router.push(`/artwork/${artwork.id}`);
      return;
    }

    setSelectedArtworkForPrice(artwork);
    setPriceRequestMessage(
      `Hello, I would like to request the price and acquisition details for "${artwork.title}".`
    );
    setRequestSuccessMessage(null);
  };

  const handleSendPriceRequest = async () => {
    if (!selectedArtworkForPrice || !currentUser) return;
    setIsSendingRequest(true);

    try {
      await createChatSession(
        selectedArtworkForPrice.id,
        currentUser.id,
        selectedArtworkForPrice.creator_id,
        priceRequestMessage.trim() || `Hello, I would like to request the price for "${selectedArtworkForPrice.title}".`
      );

      // Add to requested Set
      setRequestedArtworkIds(prev => new Set(prev).add(selectedArtworkForPrice.id));
      setRequestSuccessMessage('Your price request has been sent to the creator!');

      setTimeout(() => {
        setSelectedArtworkForPrice(null);
        setRequestSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to send price request:', err);
    } finally {
      setIsSendingRequest(false);
    }
  };

  const activeFilterCount = (artTypeFilter ? 1 : 0) + (priceFilter !== 'all' ? 1 : 0) + (sortBy !== 'recommended' ? 1 : 0);

  return (
    <div className="min-h-screen bg-[var(--color-cor-bg,#FAFAF8)] font-sans">
      {/* Main Content (Gallery & Discovery Bar) */}
      <div id="gallery" className="max-w-[1400px] mx-auto pb-32">

        {/* ========================================================================= */}
        {/* 2. SEARCH BAR & FILTERS BUTTON                                            */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl sm:rounded-full border border-[#E8E8E3] p-1.5 sm:p-2 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-3 mb-5">
          <div className="pl-3.5 text-gray-400 flex items-center shrink-0">
            <Search size={18} className="stroke-[1.75]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artworks, creators or a little inspiration..."
            className="flex-1 bg-transparent text-sm text-[#141413] placeholder:text-gray-400 outline-none min-w-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all shrink-0 cursor-pointer ${showFilters || activeFilterCount > 0
                ? 'border-[#141413] bg-[#141413] text-white'
                : 'border-[#E8E8E3] bg-white text-gray-700 hover:border-gray-400'
              }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${showFilters || activeFilterCount > 0 ? 'bg-white text-[#141413]' : 'bg-[#141413] text-white'
                }`}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 3. CATEGORY PILLS BAR                                                     */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
          {categoryPills.map((cat) => {
            const isActive = artTypeFilter === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setArtTypeFilter(cat.value)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-medium transition-all duration-150 cursor-pointer ${isActive
                    ? 'bg-[#141413] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                  }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 4. EXPANDABLE FILTER DRAWER / PANEL                                       */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-white border border-[#E8E8E3] rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-[#141413]">Filter Artworks</h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => {
                        setArtTypeFilter('');
                        setPriceFilter('all');
                        setSortBy('recommended');
                      }}
                      className="text-xs font-medium text-[#B8532F] hover:underline"
                    >
                      Reset all filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-1">
                  {/* Price Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                      Price Range
                    </label>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { value: 'all', label: 'All Prices' },
                        { value: 'on_request', label: 'Price on Request Only' },
                        { value: 'under10k', label: 'Under ₹10,000' },
                        { value: '10k-50k', label: '₹10,000 – ₹50,000' },
                        { value: '50kPlus', label: '₹50,000 and above' },
                      ].map((item) => (
                        <label
                          key={item.value}
                          className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-black py-0.5"
                        >
                          <input
                            type="radio"
                            name="priceFilter"
                            checked={priceFilter === item.value}
                            onChange={() => setPriceFilter(item.value as any)}
                            className="text-[#141413] focus:ring-[#141413]"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Medium Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                      All Mediums
                    </label>
                    <div className="space-y-1.5 text-xs">
                      {categoryPills.map((cat) => (
                        <label
                          key={cat.value}
                          className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-black py-0.5"
                        >
                          <input
                            type="radio"
                            name="mediumFilter"
                            checked={artTypeFilter === cat.value}
                            onChange={() => setArtTypeFilter(cat.value)}
                            className="text-[#141413] focus:ring-[#141413]"
                          />
                          <span>{cat.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sort by */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                      Sort By
                    </label>
                    <div className="space-y-1.5 text-xs">
                      {sortOptions.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-black py-0.5"
                        >
                          <input
                            type="radio"
                            name="sortByFilter"
                            checked={sortBy === opt.value}
                            onChange={() => setSortBy(opt.value)}
                            className="text-[#141413] focus:ring-[#141413]"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* 5. ARTWORK GALLERY GRID (Pinterest Masonry Layout matching reference spec) */}
        {/* ========================================================================= */}
        {isLoading && artworks.length === 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 sm:gap-5 [column-fill:_balance]">
            {[320, 240, 420, 280, 360, 260, 380, 300].map((height, i) => (
              <div key={i} className="break-inside-avoid mb-4 sm:mb-5">
                <div className="bg-white rounded-[22px] border border-[#E8E8E3] animate-pulse p-2 shadow-xs">
                  <div
                    style={{ height: `${height}px` }}
                    className="w-full bg-gray-100 rounded-[18px] mb-2.5"
                  />
                  <div className="space-y-2 px-1 pb-1">
                    <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : artworks.length > 0 ? (
          <>
            {(() => {
              const renderArtworkCard = (artwork: ArtworkItem) => {
                const creatorName = artwork.artist_name || artwork.profiles?.full_name || 'Independent Artist';

                return (
                  <div key={artwork.id} className="break-inside-avoid mb-4 sm:mb-5 group">
                    <div className="relative bg-white rounded-[22px] p-2 border border-[#EBEBE6] shadow-[0_2px_10px_rgba(20,20,19,0.03)] hover:shadow-[0_10px_28px_rgba(20,20,19,0.08)] transition-all duration-300">
                      <Link href={`/artwork/${artwork.id}`} className="block cursor-pointer">
                        {/* Artwork Image Container - Unconstrained natural height with Anti-Download Shield */}
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
                              <span className="inline-block px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full bg-white/95 backdrop-blur-md text-[#141413] shadow-xs">
                                {artwork.art_type}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Single Row: [Avatar] Creator Name (Poppins) on left, Availability (Poppins) on right */}
                        <div className="pt-2.5 pb-1 px-1 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex items-center gap-2 truncate">
                            <div
                              className="w-5 h-5 rounded-full bg-gray-200 border border-gray-300/60 overflow-hidden flex items-center justify-center text-[9px] font-bold text-gray-700 shrink-0 font-sans"
                              style={{ fontFamily: "'Poppins', sans-serif" }}
                            >
                              {artwork.profiles?.profile_pic_url ? (
                                <img
                                  src={artwork.profiles.profile_pic_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                getInitials(creatorName)
                              )}
                            </div>
                            <span
                              className="font-sans text-[12px] sm:text-[13px] font-medium text-[#141413] group-hover:text-[#B8532F] transition-colors truncate"
                              style={{ fontFamily: "'Poppins', sans-serif" }}
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
                              className="font-sans text-[11px] sm:text-[12px] font-medium text-gray-600 capitalize tracking-tight"
                              style={{ fontFamily: "'Poppins', sans-serif" }}
                            >
                              {artwork.status || 'Available'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                );
              };

              const firstBatch = topCreators.length > 0 ? artworks.slice(0, 8) : artworks;
              const remainingBatch = topCreators.length > 0 ? artworks.slice(8) : [];

              return (
                <>
                  {/* First Batch Masonry Columns */}
                  <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 sm:gap-5 [column-fill:_balance]">
                    {firstBatch.map(renderArtworkCard)}
                  </div>

                  {/* Spotlight: Top 10 Creators Row (Between Batches, 100% full width) */}
                  {topCreators && topCreators.length > 0 && (
                    <div className="my-8 w-full">
                      <TopCreatorsRow creators={topCreators} isLoading={isLoadingCreators} />
                    </div>
                  )}

                  {/* Remaining Batch Masonry Columns */}
                  {remainingBatch.length > 0 && (
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 sm:gap-5 [column-fill:_balance]">
                      {remainingBatch.map(renderArtworkCard)}
                    </div>
                  )}
                </>
              );
            })()}

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-7 py-3 bg-white border border-[#E8E8E3] text-[#141413] rounded-full text-xs uppercase tracking-[0.08em] font-semibold hover:border-[#141413] hover:bg-[#141413] hover:text-white transition-all duration-200 shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'Load more artworks'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-8">
            <TopCreatorsRow creators={topCreators} isLoading={isLoadingCreators} />
            <div className="text-center py-20 bg-white rounded-3xl border border-[#E8E8E3] p-8 shadow-xs">
              <h3 className="font-serif text-xl font-medium text-gray-900 mb-2">No artworks match your criteria</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                Try adjusting your search terms or clearing your filters to explore other works.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setArtTypeFilter('');
                  setPriceFilter('all');
                  setSortBy('recommended');
                }}
                className="px-5 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-full hover:bg-black transition-colors"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. PRICE ON REQUEST MODAL                                                 */}
      {/* ========================================================================= */}
      {selectedArtworkForPrice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141413]/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedArtworkForPrice(null)}
        >
          <div
            className="bg-white rounded-3xl border border-[#E8E8E3] shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  <img
                    src={selectedArtworkForPrice.image_url}
                    alt={selectedArtworkForPrice.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#141413] leading-tight">Request Price</h3>
                  <p className="text-xs text-gray-500 truncate max-w-[220px]">
                    {selectedArtworkForPrice.title} • {selectedArtworkForPrice.artist_name || selectedArtworkForPrice.profiles?.full_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedArtworkForPrice(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {requestSuccessMessage ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check size={24} />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{requestSuccessMessage}</p>
                  <p className="text-xs text-gray-500">
                    A conversation has been created in your messages with the creator.
                  </p>
                </div>
              ) : (
                <>
                  <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Price Inquiry Message
                  </label>
                  <textarea
                    value={priceRequestMessage}
                    onChange={(e) => setPriceRequestMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#141413]/10 focus:border-[#141413] focus:bg-white transition-all resize-none mb-2"
                    rows={4}
                    placeholder="Ask about pricing, dimensions, and acquisition details..."
                  />
                  <p className="text-xs text-gray-500 mb-6">
                    This inquiry will start a conversation with the creator directly in your Messages.
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedArtworkForPrice(null)}
                      disabled={isSendingRequest}
                      className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendPriceRequest}
                      disabled={isSendingRequest || !priceRequestMessage.trim()}
                      className="px-6 py-2.5 bg-[#141413] text-white rounded-full text-xs font-semibold hover:bg-black transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                      {isSendingRequest ? 'Sending...' : 'Send Price Request →'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

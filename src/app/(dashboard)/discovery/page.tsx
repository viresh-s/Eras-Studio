'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Search, SlidersHorizontal, ChevronDown, X, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createChatSession } from '@/actions/chatActions';

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
  profiles: { full_name: string } | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
};

export default function BrowsePage() {
  const router = useRouter();
  const [artworks, setArtworks] = useState<ArtworkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [artTypeFilter, setArtTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under10k' | '10k-50k' | '50kPlus' | 'on_request'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [requestedArtworkIds, setRequestedArtworkIds] = useState<Set<string>>(new Set());

  // Modal State for "Price on request"
  const [selectedArtworkForPrice, setSelectedArtworkForPrice] = useState<ArtworkItem | null>(null);
  const [priceRequestMessage, setPriceRequestMessage] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 16;

  // Load user & previous requests on mount
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
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setArtworks([]);
    setHasMore(true);
  }, [searchQuery, artTypeFilter, sortBy, priceFilter]);

  // Fetch when page changes or filters change
  useEffect(() => {
    fetchArtworks(page === 1);
  }, [page, searchQuery, artTypeFilter, sortBy, priceFilter]);

  const fetchArtworks = async (isReset = false) => {
    setIsLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('artworks')
      .select('id, creator_id, title, art_type, artist_name, image_url, price, price_visibility, status, year, profiles(full_name)', { count: 'exact' })
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
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, count } = await query;
    
    if (data) {
      if (isReset) {
        setArtworks(data as unknown as ArtworkItem[]);
      } else {
        setArtworks(prev => {
          const newArtworks = data as unknown as ArtworkItem[];
          const existingIds = new Set(prev.map(a => a.id));
          const uniqueNewArtworks = newArtworks.filter(a => !existingIds.has(a.id));
          return [...prev, ...uniqueNewArtworks];
        });
      }
      
      if (count !== null) {
        setHasMore(from + data.length < count);
      } else {
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    }
    setIsLoading(false);
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
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* ========================================================================= */}
        {/* 1. DISCOVERY HEADER (Matching user specification)                         */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#141413] tracking-tight">
            A world of original work
          </h1>

          {/* Sort Dropdown */}
          <div className="relative self-start sm:self-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white/80 backdrop-blur-xs pl-4 pr-9 py-2 border border-[#E8E8E3] rounded-full text-xs font-medium text-[#141413] hover:border-[#141413] transition-colors cursor-pointer outline-none shadow-xs"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>

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
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              showFilters || activeFilterCount > 0
                ? 'border-[#141413] bg-[#141413] text-white'
                : 'border-[#E8E8E3] bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                showFilters || activeFilterCount > 0 ? 'bg-white text-[#141413]' : 'bg-[#141413] text-white'
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
                className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive
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
        {/* 5. ARTWORK GALLERY GRID                                                   */}
        {/* ========================================================================= */}
        {isLoading && artworks.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E8E8E3] animate-pulse overflow-hidden p-3">
                <div className="aspect-[4/5] bg-gray-100 rounded-xl mb-3" />
                <div className="space-y-2 px-1">
                  <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : artworks.length > 0 ? (
          <>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {artworks.map((artwork) => {
                const isPriceOnRequest =
                  artwork.price_visibility === 'Price on Request' ||
                  (!artwork.price &&
                    artwork.price_visibility !== 'Hide Price' &&
                    artwork.price_visibility !== 'Hidden');

                const isRequested = requestedArtworkIds.has(artwork.id);

                return (
                  <motion.div key={artwork.id} variants={itemVariants} className="h-full">
                    <Link href={`/artwork/${artwork.id}`} className="group block h-full cursor-pointer">
                      <div className="flex flex-col h-full bg-white rounded-2xl border border-[#E8E8E3] p-3 shadow-soft hover:shadow-soft-md transition-all duration-300">
                        {/* Artwork Image Container */}
                        <div className="aspect-[4/5] bg-[#E8E8E3] overflow-hidden relative rounded-xl mb-3.5">
                          <img
                            src={artwork.image_url}
                            alt={artwork.title}
                            className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
                          />
                          {/* Medium Badge */}
                          <div className="absolute top-3 right-3 z-10">
                            <span className="inline-block px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full bg-white/90 backdrop-blur-md text-[#141413] shadow-xs">
                              {artwork.art_type}
                            </span>
                          </div>
                        </div>
                        
                        {/* Artwork Metadata & Price Bar */}
                        <div className="flex-1 flex flex-col justify-between px-1">
                          <div className="mb-3">
                            <h3 className="font-serif text-[18px] font-semibold text-[#141413] truncate leading-tight group-hover:text-[#B8532F] transition-colors">
                              {artwork.title}
                            </h3>
                            <p className="text-gray-500 text-[11px] mt-1 uppercase tracking-wider font-medium truncate">
                              {artwork.artist_name || artwork.profiles?.full_name}
                              {artwork.year ? `, ${artwork.year}` : ''}
                            </p>
                          </div>

                          {/* Price & Action Footer */}
                          <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                              {isPriceOnRequest ? 'Direct Inquiry' : 'Available'}
                            </span>

                            {artwork.price_visibility === 'Hide Price' || artwork.price_visibility === 'Hidden' ? (
                              <span className="text-xs font-medium text-gray-400">
                                Disclosed on inquiry
                              </span>
                            ) : isPriceOnRequest ? (
                              /* Interactive "Price on request" Button */
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenPriceRequest(artwork);
                                }}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all shadow-xs cursor-pointer ${
                                  isRequested
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-[#141413] text-[#FAF5EC] hover:bg-black active:scale-95'
                                }`}
                              >
                                {isRequested ? 'Price Requested ✓' : 'Price on request'}
                              </button>
                            ) : artwork.price ? (
                              <span className="font-bold text-[#141413] text-sm">
                                ₹{artwork.price.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenPriceRequest(artwork);
                                }}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all shadow-xs cursor-pointer ${
                                  isRequested
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-[#141413] text-[#FAF5EC] hover:bg-black'
                                }`}
                              >
                                {isRequested ? 'Price Requested ✓' : 'Price on request'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={isLoading}
                  className="px-7 py-3 bg-white border border-[#E8E8E3] text-[#141413] rounded-full text-xs uppercase tracking-[0.08em] font-semibold hover:border-[#141413] hover:bg-[#141413] hover:text-white transition-all duration-200 shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'Load more artworks'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-[#E8E8E3] p-8 shadow-xs">
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

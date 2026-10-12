'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { Search, Filter, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const artTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'Painting', label: 'Painting' },
  { value: 'Sculpture', label: 'Sculpture' },
  { value: 'Photography', label: 'Photography' },
  { value: 'Digital Art', label: 'Digital Art' },
  { value: 'Drawing', label: 'Drawing' },
  { value: 'Print', label: 'Print' },
  { value: 'Mixed Media', label: 'Mixed Media' },
  { value: 'Collage', label: 'Collage' },
  { value: 'Textile Art', label: 'Textile Art' },
  { value: 'Ceramic', label: 'Ceramic' },
  { value: 'Other', label: 'Other' },
];

interface ArtworkItem {
  id: string;
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
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as any } }
};

export default function BrowsePage() {
  const [artworks, setArtworks] = useState<ArtworkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [artTypeFilter, setArtTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 12;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setArtworks([]);
    setHasMore(true);
  }, [searchQuery, artTypeFilter]);

  // Fetch when page changes or filters reset
  useEffect(() => {
    fetchArtworks(page === 1);
  }, [page, searchQuery, artTypeFilter]);

  const fetchArtworks = async (isReset = false) => {
    setIsLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('artworks')
      .select('id, title, art_type, artist_name, image_url, price, price_visibility, status, year, profiles(full_name)', { count: 'exact' })
      .eq('status', 'Available')
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.ilike('artist_name', `%${searchQuery}%`);
    }

    if (artTypeFilter) {
      query = query.eq('art_type', artTypeFilter);
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
          // Prevent duplicates on double-fetch during strict mode
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

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans">
      {/* Hero Section */}
      <div className="max-w-[1400px] mx-auto px-6 py-20 lg:py-32">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24">
          
          {/* Left: Text Content */}
          <div className="lg:w-1/2 flex flex-col items-start text-left z-10">
            <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase mb-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 block"></span>
              A SPACE FOR THE CREATIVE SPIRIT
            </p>
            <h1 className="text-6xl md:text-[80px] font-bold text-gray-900 tracking-tight leading-[1.05] mb-6 font-serif">
              Find a work.<br />
              Feel a <span className="italic font-normal">connection.</span>
            </h1>
            <div className="space-y-1 mb-10">
              <p className="text-gray-600 text-lg">
                Discover original perspectives from independent artists.
              </p>
              <p className="text-gray-600 text-lg">
                A new favourite is waiting to be found.
              </p>
            </div>
            
            <button
              onClick={() => {
                document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#141413] text-[#FAF5EC] border border-[#141413] rounded-full text-xs uppercase tracking-[0.08em] font-medium hover:bg-black transition-all duration-200 group"
            >
              <span>Explore the gallery</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
            

          </div>
          
          {/* Right: Artwork Cards Collage */}
          <div className="lg:w-1/2 relative h-[500px] w-full flex items-center justify-center pointer-events-none mt-12 lg:mt-0">
            {/* Card 1 (Left) */}
            <motion.div 
              initial={{ opacity: 0, rotate: -25, x: -100, y: 50 }}
              animate={{ opacity: 1, rotate: -15, x: -80, y: 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute z-10 w-64 bg-white rounded-xl shadow-2xl p-3 transform-origin-bottom"
            >
              <div className="aspect-[3/4] bg-[#5B798A] overflow-hidden rounded-lg mb-3">
                {/* Simulated art pattern */}
                <div className="w-full h-full relative">
                   <div className="absolute top-0 right-0 w-full h-1/2 bg-[#1B3644] rotate-[30deg] scale-150 transform origin-top-right"></div>
                   <div className="absolute bottom-0 right-0 w-2/3 h-1/2 bg-[#C4775A] skew-y-12 translate-y-10"></div>
                   <div className="absolute top-1/4 right-1/4 w-12 h-12 bg-[#F2F0E6] rounded-full"></div>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">Blue Horizon</p>
                <p className="text-[8px] text-gray-400">Painting / 2023</p>
              </div>
            </motion.div>

            {/* Card 2 (Center - top) */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: -20 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute z-30 w-72 bg-white rounded-xl shadow-2xl p-3"
            >
              <div className="aspect-[3/4] bg-[#D7AC9C] overflow-hidden rounded-lg mb-3">
                {/* Simulated art pattern */}
                <div className="w-full h-full relative">
                   <div className="absolute top-0 right-0 w-full h-2/3 bg-[#5D3035] -rotate-[20deg] scale-150 transform origin-top-right"></div>
                   <div className="absolute bottom-0 left-1/4 w-1/3 h-3/4 bg-[#1F3740] skew-y-[-10deg] translate-y-10"></div>
                   <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-[#F2F0E6] rounded-full"></div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900 mb-0.5">Monsoon No. 4</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-wide">Painting / 2023</p>
              </div>
            </motion.div>

            {/* Card 3 (Right) */}
            <motion.div 
              initial={{ opacity: 0, rotate: 25, x: 100, y: 50 }}
              animate={{ opacity: 1, rotate: 15, x: 80, y: 20 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute z-20 w-64 bg-white rounded-xl shadow-2xl p-3 transform-origin-bottom"
            >
              <div className="aspect-[3/4] bg-[#F2B75A] overflow-hidden rounded-lg mb-3">
                {/* Simulated art pattern */}
                <div className="w-full h-full relative p-4">
                   <div className="w-full h-full border-[20px] border-[#AC452D] rounded-t-full bg-[#E5D7A9] relative overflow-hidden">
                     <div className="w-full h-20 bg-[#C4775A] absolute bottom-0 opacity-50"></div>
                     <div className="w-16 h-16 rounded-full bg-[#F2F0E6] absolute top-10 left-1/2 -translate-x-1/2"></div>
                   </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">Fragments of Memory</p>
                <p className="text-[8px] text-gray-400">Mixed Media / 2024</p>
              </div>
            </motion.div>

            {/* Circular text badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute z-40 -bottom-10 left-[45%] lg:left-1/3 w-28 h-28 bg-[#F0EBE6] rounded-full flex items-center justify-center shadow-lg border border-white"
            >
              <div className="text-center">
                <p className="text-gray-800 text-sm font-serif italic leading-tight">Art is a</p>
                <p className="text-gray-800 text-sm font-serif italic leading-tight">way of</p>
                <p className="text-gray-800 text-sm font-serif italic leading-tight">seeing.</p>
                <p className="text-[6px] tracking-widest text-gray-500 mt-2 uppercase">Eras Studio</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content (Gallery) */}
      <div id="gallery" className="max-w-[1400px] mx-auto px-6 pb-32">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Explore collection</h2>
          <div className="flex gap-4">
            <div className="relative w-64 hidden md:block">
              <input
                className="w-full px-4 py-2 pl-10 text-sm bg-white border border-gray-200 rounded-full outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-gray-400"
                placeholder="Search artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3.5 top-2.5 text-gray-400" size={16} />
            </div>
            <select
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-full outline-none cursor-pointer transition-all duration-200 focus:border-gray-400 appearance-none pr-8 relative"
              value={artTypeFilter}
              onChange={(e) => setArtTypeFilter(e.target.value)}
            >
              {artTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {isLoading && artworks.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
               <div key={i} className="bg-white rounded-xl border border-gray-200 animate-pulse overflow-hidden">
                <div className="aspect-[4/5] bg-gray-100" />
                <div className="p-4 space-y-3">
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
            {artworks.map((artwork) => (
              <motion.div key={artwork.id} variants={itemVariants} className="h-full">
                <Link href={`/artwork/${artwork.id}`} className="group block h-full cursor-pointer">
                  <div className="flex flex-col h-full">
                    <div className="aspect-[4/5] bg-[#E8E8E3] overflow-hidden relative rounded-xl mb-4">
                      <img
                        src={artwork.image_url}
                        alt={artwork.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      {/* Status tag */}
                      <div className="absolute top-4 right-4 z-10">
                        <span className="inline-block px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-full bg-white/90 backdrop-blur-md text-[var(--color-cor-ink)] shadow-sm">
                          {artwork.art_type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col px-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-[19px] font-bold text-[var(--color-cor-ink)] truncate leading-tight group-hover:opacity-70 transition-opacity">{artwork.title}</h3>
                          <p className="text-[var(--color-cor-ink-light)] text-[11px] mt-1.5 uppercase tracking-wider font-semibold">
                            {artwork.artist_name || artwork.profiles?.full_name}
                            {artwork.year ? `, ${artwork.year}` : ''}
                          </p>
                        </div>
                        <div className="shrink-0 text-right pt-0.5">
                          {artwork.price_visibility === 'Hide Price' || artwork.price_visibility === 'Hidden' ? null : artwork.price_visibility === 'Price on Request' ? (
                            <span className="text-[var(--color-cor-ink-light)] text-[11px] font-medium uppercase tracking-wider">On Request</span>
                          ) : artwork.price ? (
                            <span className="font-bold text-[var(--color-cor-ink)] text-sm">
                              ₹{artwork.price.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-[var(--color-cor-ink-light)] text-[11px] font-medium uppercase tracking-wider">On Request</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            </motion.div>

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-transparent border border-[#141413]/25 text-[#141413] rounded-full text-xs uppercase tracking-[0.08em] font-medium hover:border-[#141413] hover:bg-[#141413] hover:text-[#FAF5EC] transition-all duration-200 shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FAF5EC] rounded-3xl border border-[#E8E8E3] py-24 px-6 text-center shadow-soft-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#E8E8E3]">
              <Filter size={24} className="text-[#9A3B3B]" />
            </div>
            <p className="font-serif italic text-[var(--color-cor-ink)] text-2xl mb-3 tracking-tight">No artworks found</p>
            <p className="text-[var(--color-cor-ink-light)] text-sm font-medium">Try adjusting your search or filter criteria to discover new pieces.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

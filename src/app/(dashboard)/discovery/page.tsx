'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { Search, Filter, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const artTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'painting', label: 'Painting' },
  { value: 'sculpture', label: 'Sculpture' },
  { value: 'photography', label: 'Photography' },
  { value: 'digital-art', label: 'Digital Art' },
  { value: 'drawing', label: 'Drawing' },
  { value: 'print', label: 'Print' },
  { value: 'mixed-media', label: 'Mixed Media' },
  { value: 'collage', label: 'Collage' },
  { value: 'textile', label: 'Textile Art' },
  { value: 'ceramic', label: 'Ceramic' },
  { value: 'other', label: 'Other' },
];

interface ArtworkItem {
  id: string;
  title: string;
  art_type: string;
  artist_name: string;
  image_url: string;
  price: number | null;
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
      .select('id, title, art_type, artist_name, image_url, price, status, year, profiles(full_name)', { count: 'exact' })
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
              className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Explore the gallery
              <ArrowRight size={18} />
            </button>
            
            <div className="mt-16 flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#F5F5F5] bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">RM</div>
                <div className="w-10 h-10 rounded-full border-2 border-[#F5F5F5] bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">MN</div>
                <div className="w-10 h-10 rounded-full border-2 border-[#F5F5F5] bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">AR</div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-900 leading-tight">Independent minds.</span>
                <span className="text-xs text-gray-500 leading-tight">Extraordinary perspectives.</span>
              </div>
            </div>
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
                <Link href={`/artwork/${artwork.id}`} className="group block h-full">
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <div className="aspect-[4/5] bg-gray-100 overflow-hidden relative">
                      <img
                        src={artwork.image_url}
                        alt={artwork.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                      {/* Status tag */}
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-white text-gray-900 shadow-sm">
                          {artwork.art_type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-gray-900 truncate">{artwork.title}</h3>
                          <p className="text-gray-500 text-xs mt-0.5">
                            <span className="font-medium text-gray-700">{artwork.artist_name || artwork.profiles?.full_name}</span>
                            {artwork.year ? ` · ${artwork.year}` : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        {artwork.price ? (
                          <span className="font-bold text-gray-900 text-sm">
                            ${artwork.price}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs font-medium">Price on request</span>
                        )}
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
                  className="px-8 py-3 bg-white border border-gray-200 text-gray-900 rounded-full font-semibold hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
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
            className="bg-white rounded-xl border border-gray-200 p-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Filter size={24} className="text-gray-400" />
            </div>
            <p className="font-extrabold text-gray-900 text-2xl mb-3 tracking-tight">No artworks found</p>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

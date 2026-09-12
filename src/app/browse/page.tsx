'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';

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
  profiles: { full_name: string } | null;
}

export default function BrowsePage() {
  const [artworks, setArtworks] = useState<ArtworkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [artTypeFilter, setArtTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchArtworks();
  }, [searchQuery, artTypeFilter]);

  const fetchArtworks = async () => {
    setIsLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('artworks')
      .select('id, title, art_type, artist_name, image_url, price, status, profiles(full_name)')
      .eq('status', 'Available')
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.ilike('artist_name', `%${searchQuery}%`);
    }

    if (artTypeFilter) {
      query = query.eq('art_type', artTypeFilter);
    }

    const { data } = await query;
    setArtworks((data as unknown as ArtworkItem[]) || []);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-offwhite">
      {/* Header */}
      <div className="border-b-4 border-brand-black bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="font-heading text-4xl font-bold mb-2">Browse Artworks</h1>
          <p className="text-brand-gray text-lg">Discover extraordinary pieces from talented creators</p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Input
              placeholder="Search by artist name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 top-3 text-brand-gray" size={18} />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={artTypeOptions}
              value={artTypeFilter}
              onChange={(e) => setArtTypeFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border-3 border-brand-black bg-white animate-pulse">
                <div className="aspect-[4/3] bg-brand-lightgray" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-brand-lightgray w-3/4" />
                  <div className="h-4 bg-brand-lightgray w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : artworks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {artworks.map((artwork) => (
              <Link key={artwork.id} href={`/artwork/${artwork.id}`}>
                <Card padding="none" className="cursor-pointer h-full">
                  <div className="aspect-[4/3] bg-brand-lightgray border-b-3 border-brand-black overflow-hidden">
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading font-bold text-lg truncate">{artwork.title}</h3>
                    <p className="text-brand-gray text-sm mt-1">{artwork.artist_name}</p>
                    <div className="flex items-center justify-between mt-3">
                      {artwork.price ? (
                        <span className="font-heading font-bold text-lg">${artwork.price}</span>
                      ) : (
                        <span className="text-brand-gray text-sm">Price on request</span>
                      )}
                      <Badge variant="green">{artwork.art_type}</Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <Filter size={48} className="mx-auto mb-3 text-brand-gray" />
              <p className="font-heading text-xl font-bold mb-2">No artworks found</p>
              <p className="text-brand-gray">Try adjusting your search or filter criteria</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

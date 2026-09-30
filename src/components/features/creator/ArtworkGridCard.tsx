'use client';

import Link from 'next/link';

interface ArtworkGridCardProps {
  artwork: {
    id: string;
    title: string;
    image_url: string;
    art_type: string;
    artist_name?: string;
    year?: string | null;
    price?: number | null;
    status: string;
    is_published?: boolean;
  };
  creatorName?: string;
  children?: React.ReactNode;
}

const getInitials = (name: string) => {
  if (!name) return 'A';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default function ArtworkGridCard({ artwork, creatorName, children }: ArtworkGridCardProps) {
  const displayName = creatorName || artwork.artist_name || 'Artist';

  return (
    <div className="group">
      <Link href={`/artwork/${artwork.id}`}>
        <div className="bg-transparent overflow-hidden hover:opacity-95 transition-opacity">
          {/* Image Container */}
          <div className="aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden relative shadow-sm border border-gray-100">
            <img
              src={artwork.image_url}
              alt={artwork.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
            />
            {/* Tag on image */}
            {artwork.is_published === false ? (
              <div className="absolute bottom-3 left-3 bg-amber-100/95 backdrop-blur-md px-2.5 py-1 rounded text-[9px] font-bold tracking-[0.15em] text-amber-800 uppercase shadow-sm border border-amber-200/50">
                Draft
              </div>
            ) : (
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded text-[9px] font-bold tracking-[0.15em] text-gray-900 uppercase shadow-sm border border-white/20">
                Curator's Pick
              </div>
            )}
          </div>
          
          {/* Content Container */}
          <div className="pt-4 pb-2">
            <div className="flex justify-between items-baseline mb-1 gap-2">
              <h3 className="font-heading text-xl font-semibold text-gray-900 truncate tracking-tight">
                {artwork.title}
              </h3>
              {artwork.year && (
                <span className="text-[11px] text-gray-400 font-medium tracking-wider ml-auto flex-shrink-0">
                  {artwork.year}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600 flex-shrink-0">
                {getInitials(displayName)}
              </div>
              <p className="text-[11px] text-gray-500 truncate">
                <span className="font-medium text-gray-700">{displayName}</span>{' '}
                <span className="text-gray-400 mx-0.5">·</span>{' '}
                {artwork.art_type}
              </p>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  artwork.status === 'Available' ? 'bg-green-500' :
                  artwork.status === 'Sold' ? 'bg-red-400' : 'bg-gray-400'
                }`} />
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                  {artwork.status}
                </span>
              </div>
              
              {artwork.price && (
                <span className="text-xs font-bold text-gray-900">
                  ${artwork.price.toLocaleString()}
                </span>
              )}
            </div>
            
            {/* Any actions injected by parent (like the ... menu) */}
            {children && (
              <div className="mt-2">
                {children}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

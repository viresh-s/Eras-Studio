import React from 'react';
import { Skeleton, ArtworkGridSkeleton } from '@/components/ui/Skeleton';

export default function DiscoveryLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-cor-bg,#FAFAF8)]">
      <div className="max-w-[1400px] mx-auto pb-32 animate-pulse">
        {/* Search Bar Skeleton */}
        <div className="p-2 rounded-full border border-[#E8E8E3] bg-white mb-5 shadow-xs flex items-center gap-3">
          <Skeleton className="w-5 h-5 rounded-full ml-3" />
          <Skeleton className="h-5 flex-1 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full mr-2" />
        </div>

        {/* Category Pills Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {[80, 96, 110, 100, 115, 90].map((w, i) => (
            <Skeleton
              key={i}
              style={{ width: `${w}px` }}
              className="h-8 rounded-full shrink-0"
            />
          ))}
        </div>

        {/* Artwork Grid Skeleton */}
        <ArtworkGridSkeleton count={8} />
      </div>
    </div>
  );
}

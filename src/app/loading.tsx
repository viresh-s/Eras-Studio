import React from 'react';
import { Skeleton, ArtworkGridSkeleton } from '@/components/ui/Skeleton';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-cor-bg,#FFFFFF)]">
      {/* Hero Skeleton Banner */}
      <div className="pt-14 pb-14 sm:pt-20 sm:pb-18 border-b border-[#E8E8E3] bg-[#FAF9F5] animate-pulse">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-4">
          <Skeleton className="h-4 w-32 rounded-full mx-auto" />
          <Skeleton className="h-10 sm:h-14 w-3/4 sm:w-2/3 rounded-2xl mx-auto" />
          <Skeleton className="h-4 w-1/2 rounded-full mx-auto" />
        </div>
      </div>

      {/* Grid Content Skeleton */}
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <ArtworkGridSkeleton count={8} />
      </div>
    </div>
  );
}

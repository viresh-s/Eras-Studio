import React from 'react';
import { Skeleton, StatsCardsSkeleton } from '@/components/ui/Skeleton';

export default function CorLoading() {
  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 space-y-8 animate-pulse">
      {/* COR Hero Banner Skeleton */}
      <div className="bg-[#FAF9F5] border border-[#E8E8E3] rounded-3xl p-8 sm:p-12 space-y-4">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-10 sm:h-12 w-2/3 sm:w-1/2 rounded-2xl" />
        <Skeleton className="h-4 w-3/4 rounded-full" />
      </div>

      {/* Metrics Bar Skeleton */}
      <StatsCardsSkeleton count={4} />

      {/* Pipeline Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-[#E8E8E3] rounded-3xl p-6 space-y-4 shadow-xs">
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-4 w-28 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

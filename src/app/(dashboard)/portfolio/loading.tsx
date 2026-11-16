import React from 'react';
import { Skeleton, StatsCardsSkeleton, ArtworkGridSkeleton } from '@/components/ui/Skeleton';

export default function PortfolioLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-cor-bg,#FAFAF8)] space-y-6 animate-pulse">
      {/* Creator Profile Header Skeleton */}
      <div className="bg-white rounded-3xl border border-[#E8E8E3] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-6 sm:h-7 w-44 rounded-xl" />
              <Skeleton className="h-3.5 w-32 rounded-full" />
              <Skeleton className="h-3 w-48 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
        </div>
      </div>

      {/* 4 Metrics Stats Cards Skeleton */}
      <StatsCardsSkeleton count={4} />

      {/* Tabs & Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full sm:w-64 rounded-full" />
      </div>

      {/* Artwork Grid Skeleton */}
      <ArtworkGridSkeleton count={8} />
    </div>
  );
}

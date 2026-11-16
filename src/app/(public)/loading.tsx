import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Editorial Hero Header Skeleton */}
      <div className="pt-14 pb-14 sm:pt-20 sm:pb-18 border-b border-[#E8E8E3] bg-[#FAF9F5] animate-pulse">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-4">
          <Skeleton className="h-4 w-28 rounded-full mx-auto" />
          <Skeleton className="h-10 sm:h-12 w-2/3 sm:w-1/2 rounded-2xl mx-auto" />
        </div>
      </div>

      {/* Main Body Skeleton */}
      <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

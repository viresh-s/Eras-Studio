import React from 'react';
import { Skeleton, FormSkeleton } from '@/components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-pulse">
      {/* Editorial Page Header Skeleton */}
      <div className="border-b border-[#E8E8E3] pb-6 space-y-3">
        <Skeleton className="h-3.5 w-36 rounded-full" />
        <Skeleton className="h-9 sm:h-10 w-64 rounded-xl" />
      </div>

      <FormSkeleton />
    </div>
  );
}

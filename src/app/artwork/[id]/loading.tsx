import React from 'react';
import { ArtworkDetailSkeleton } from '@/components/ui/Skeleton';

export default function ArtworkPageLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-cor-bg,#FAFAF8)] py-4 sm:py-8">
      <ArtworkDetailSkeleton />
    </div>
  );
}

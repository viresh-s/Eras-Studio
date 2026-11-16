import React from "react";

export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#ECECE7] ${className}`}
      {...props}
    />
  );
}

/**
 * Skeleton for a single artwork card matching DiscoveryArtworkCard
 */
export function ArtworkCardSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="w-full bg-white rounded-[16px] sm:rounded-[22px] p-1.5 sm:p-2 border border-[#E8E8E3] shadow-xs animate-pulse">
      <div
        style={{ height: `${height}px` }}
        className="w-full bg-[#EBEBE6] rounded-[13px] sm:rounded-[18px] mb-2"
      />
      <div className="pt-2 pb-0.5 px-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Skeleton className="w-5 h-5 rounded-full shrink-0" />
          <Skeleton className="h-3.5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-3 w-14 rounded-full shrink-0" />
      </div>
    </div>
  );
}

/**
 * Responsive Masonry/Grid of artwork card skeletons
 */
export function ArtworkGridSkeleton({ count = 8 }: { count?: number }) {
  const heights = [320, 260, 360, 290, 310, 270, 340, 280];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 items-start">
      {Array.from({ length: count }).map((_, i) => (
        <ArtworkCardSkeleton key={i} height={heights[i % heights.length]} />
      ))}
    </div>
  );
}

/**
 * Skeleton for page headers (Title + Action buttons)
 */
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-8 sm:h-10 w-56 sm:w-72 rounded-xl" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for 4-column metrics / stats cards
 */
export function StatsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8E8E3] p-5 space-y-3 shadow-2xs animate-pulse"
        >
          <Skeleton className="h-3.5 w-24 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-xl" />
          <Skeleton className="h-3 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for tabular / list data
 */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4 animate-pulse">
      <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E3]">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-4 w-32 rounded-full hidden sm:block" />
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-3.5 border-b border-[#F2F0ED] last:border-none"
        >
          <div className="flex items-center gap-3.5">
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-4 w-24 rounded-full hidden sm:block" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for Artwork detail page (/artwork/[id])
 */
export function ArtworkDetailSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Large artwork image */}
        <div className="lg:col-span-7 bg-[#FAF9F5] border border-[#E8E8E3] rounded-3xl p-4 sm:p-6">
          <Skeleton className="w-full aspect-[4/5] sm:aspect-square rounded-2xl" />
        </div>

        {/* Right: Creator Dossier & Inquire */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-[#E8E8E3] p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-3 w-24 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-8 w-4/5 rounded-xl" />
            <Skeleton className="h-4 w-32 rounded-full" />
            <div className="pt-4 border-t border-[#F0F0EB] space-y-3">
              <Skeleton className="h-10 w-full rounded-full" />
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Chat / Messages page (/messages)
 */
export function ChatListSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-[#E8E8E3] overflow-hidden shadow-xs animate-pulse">
      <div className="p-4 sm:p-6 border-b border-[#E8E8E3] flex items-center justify-between">
        <Skeleton className="h-6 w-36 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="divide-y divide-[#F0F0EB]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 sm:p-5 flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-3 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-3/4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for profile editing & settings forms
 */
export function FormSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-[#E8E8E3] p-6 sm:p-10 space-y-6 animate-pulse max-w-4xl mx-auto">
      <div className="flex items-center gap-4 pb-6 border-b border-[#E8E8E3]">
        <Skeleton className="w-20 h-20 rounded-full shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40 rounded-xl" />
          <Skeleton className="h-4 w-28 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-20 rounded-full" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-20 rounded-full" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-24 rounded-full" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <Skeleton className="h-12 w-44 rounded-full" />
    </div>
  );
}

/**
 * Skeleton for public artist profile dossier (/artist/[id])
 */
export function ArtistProfileSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-20 animate-pulse">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        {/* Cover banner skeleton */}
        <div className="h-36 sm:h-48 md:h-64 rounded-[20px] bg-[#EBEBE6] mx-auto max-w-6xl" />

        {/* Avatar & bio skeleton */}
        <div className="flex flex-col items-center -mt-16 sm:-mt-20 mb-8 relative z-10">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#E5E5DF] border-4 border-white shadow-md mb-4" />
          <div className="space-y-2 text-center flex flex-col items-center">
            <Skeleton className="h-7 sm:h-8 w-48 sm:w-56 rounded-xl" />
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-3.5 w-64 max-w-md rounded-full mt-2" />
          </div>

          {/* Social / action pills skeleton */}
          <div className="flex items-center gap-3 mt-5">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-full" />
          </div>
        </div>

        {/* Tab row skeleton */}
        <div className="flex justify-center gap-3 border-b border-[#E8E8E3] pb-4 mb-8">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>

        {/* Artwork grid */}
        <ArtworkGridSkeleton count={8} />
      </div>
    </div>
  );
}

/**
 * Skeleton for Subscription Plans page (/subscription)
 */
export function SubscriptionPlansSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14 animate-pulse">
      {/* Header */}
      <div className="border-b border-[#E8E8E3] pb-6 mb-10">
        <Skeleton className="h-3.5 w-36 rounded-full mb-3" />
        <Skeleton className="h-10 sm:h-12 w-72 sm:w-96 rounded-xl mb-3" />
        <Skeleton className="h-4 w-full max-w-md rounded-full" />
      </div>

      {/* 3 Pricing tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl border border-[#E8E8E3] p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-24 rounded-full" />
                {i === 1 && <Skeleton className="h-5 w-20 rounded-full" />}
              </div>
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-3.5 w-full rounded-full" />
              <div className="pt-4 border-t border-[#F0F0EB] space-y-3">
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-4 w-5/6 rounded-full" />
                <Skeleton className="h-4 w-2/3 rounded-full" />
                <Skeleton className="h-4 w-4/5 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-12 w-full rounded-full mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for Purchases & Saved page (/purchases)
 */
export function PurchasesSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-pulse">
      {/* Page Title */}
      <div className="mb-6 sm:mb-8 space-y-2">
        <Skeleton className="h-10 sm:h-12 w-64 rounded-xl" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>

      {/* Card Grid */}
      <ArtworkGridSkeleton count={6} />
    </div>
  );
}


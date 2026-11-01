import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-8 max-w-[1400px] mx-auto py-2">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="h-10 w-56 bg-gray-100 rounded-xl" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-12 w-40 bg-gray-100 rounded-full" />
          <div className="h-12 w-40 bg-gray-100 rounded-full" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl border border-[var(--color-cor-border)] p-5 space-y-3 shadow-2xs"
          >
            <div className="h-3 w-28 bg-gray-100 rounded-md" />
            <div className="h-8 w-16 bg-gray-100 rounded-lg" />
            <div className="h-3 w-20 bg-gray-100 rounded-md" />
          </div>
        ))}
      </div>

      {/* Content Section Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <div className="h-6 w-36 bg-gray-100 rounded-lg" />
            <div className="h-3 w-48 bg-gray-100 rounded-md" />
          </div>
          <div className="h-9 w-32 bg-gray-100 rounded-full" />
        </div>

        {/* Grid Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[var(--color-cor-border)] overflow-hidden shadow-2xs space-y-3 p-3"
            >
              <div className="w-full aspect-square bg-gray-100 rounded-xl" />
              <div className="h-4 w-3/4 bg-gray-100 rounded-md" />
              <div className="h-3 w-1/2 bg-gray-100 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


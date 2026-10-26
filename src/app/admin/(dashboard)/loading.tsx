import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header Skeleton */}
      <div className="border-b border-[#E8E8E3] pb-6 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-full" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="p-2 sm:p-2.5 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
        <Skeleton className="h-8 sm:w-64 w-full rounded-full ml-auto" />
      </div>

      {/* Table / Grid Content Skeleton */}
      <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-soft-sm space-y-4">
        {/* Table header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E3]">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-full" />
        </div>

        {/* Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3.5 border-b border-[#FAF5EC] last:border-none"
          >
            <div className="flex items-center gap-3.5">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-3 w-24 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-4 w-40 hidden sm:block rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

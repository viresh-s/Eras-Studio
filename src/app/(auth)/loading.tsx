import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4 sm:p-6 animate-pulse">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E8E3] p-8 sm:p-10 shadow-xs space-y-6">
        {/* Logo / Badge Skeleton */}
        <div className="flex flex-col items-center space-y-3">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <Skeleton className="h-7 w-44 rounded-xl" />
          <Skeleton className="h-3.5 w-60 rounded-full" />
        </div>

        {/* Inputs Skeleton */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-16 rounded-full" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-20 rounded-full" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        {/* Submit Button Skeleton */}
        <Skeleton className="h-12 w-full rounded-full" />

        {/* Footer Skeleton */}
        <div className="flex justify-center pt-2">
          <Skeleton className="h-3.5 w-48 rounded-full" />
        </div>
      </div>
    </div>
  );
}

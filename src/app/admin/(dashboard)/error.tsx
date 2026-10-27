"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 py-12 animate-in fade-in duration-200">
      <div className="p-8 sm:p-10 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm max-w-lg w-full flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-[#000000] border border-black flex items-center justify-center text-white mb-4 shadow-soft-sm">
          <AlertTriangle className="w-6 h-6 stroke-[1.75]" />
        </div>

        <h2 className="text-2xl font-medium tracking-tight text-[#141413]">
          Something went wrong
        </h2>

        <p className="mt-2 text-xs md:text-sm text-[#6E6E69] leading-relaxed">
          An unexpected error occurred while loading this section of the admin panel.
          {error.message ? (
            <span className="block mt-2 font-mono text-[11px] text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] px-3 py-1.5 rounded-xl">
              {error.message}
            </span>
          ) : null}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141413] hover:bg-[#2A2A28] text-white text-xs font-medium tracking-[0.04em] shadow-soft-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/admin/overview"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#E8E8E3] bg-white text-xs font-medium text-[#6E6E69] hover:text-[#141413] hover:bg-[#F2F0ED] transition-all shadow-soft-sm"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

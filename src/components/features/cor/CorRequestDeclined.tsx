'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  FileEdit,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

interface CorRequestDeclinedProps {
  declinedReason: string | null;
}

export default function CorRequestDeclined({ declinedReason }: CorRequestDeclinedProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-3xl p-7 sm:p-10 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF2F2] text-[#9E1F1F] border border-[#F8D7DA]">
            <AlertCircle size={13} className="text-[#9E1F1F]" />
            <span>COR REQUEST DECLINED</span>
          </div>
        </div>

        <div className="space-y-2 max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#141413] tracking-tight">
            Your COR request was not approved at this time.
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed">
            Thank you for applying to the COR program. Our advisory team evaluates applications based on portfolio completeness, alignment with current partner institutions, and active studio readiness.
          </p>
        </div>

        {/* Reason card */}
        {declinedReason && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E8E3] space-y-2 max-w-2xl">
            <span className="text-[10px] uppercase font-semibold text-[#8A8A85] flex items-center gap-1.5">
              <HelpCircle size={12} />
              <span>Feedback from Curatorial Reviewer</span>
            </span>
            <p className="text-xs sm:text-sm text-[#141413] font-normal leading-relaxed">
              {declinedReason}
            </p>
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center gap-4">
          <Link
            href="/cor/profile"
            style={{
              position: 'relative',
              background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
              boxShadow: '0px 7px 22px rgba(35, 77, 255, 0.18), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
              borderRadius: 40,
              outline: '2px #2356FF solid',
              outlineOffset: '-2px',
            }}
            className="px-6 py-3 text-white text-xs sm:text-sm font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer shadow-xs select-none"
          >
            <RefreshCw size={14} className="text-white" />
            <span>Update Profile & Re-apply</span>
            <ArrowRight size={14} className="text-white" />
          </Link>
        </div>
      </div>

      {/* Helpful Recommendations Card */}
      <div className="bg-white border border-[#E8E8E3] rounded-3xl p-7 sm:p-9 space-y-6">
        <div className="border-b border-[#F0F0EB] pb-4">
          <h2 className="font-serif text-xl font-semibold text-[#141413]">
            How to strengthen your re-application
          </h2>
          <p className="text-xs text-[#6E6E69] mt-0.5">
            Key areas our curatorial committee prioritizes during reviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] space-y-2">
            <div className="w-8 h-8 rounded-full bg-white border border-[#E8E8E3] flex items-center justify-center text-[#141413] font-bold text-xs">
              1
            </div>
            <h3 className="font-serif text-sm font-semibold text-[#141413]">
              Complete Portfolio & CV
            </h3>
            <p className="text-xs text-[#6E6E69] leading-relaxed">
              Ensure your portfolio link contains high-resolution documentation of recent works, accompanied by an up-to-date artist CV or resume.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] space-y-2">
            <div className="w-8 h-8 rounded-full bg-white border border-[#E8E8E3] flex items-center justify-center text-[#141413] font-bold text-xs">
              2
            </div>
            <h3 className="font-serif text-sm font-semibold text-[#141413]">
              Artistic Statement & Mediums
            </h3>
            <p className="text-xs text-[#6E6E69] leading-relaxed">
              Detail your conceptual framework, primary mediums, and specific thematic focus to assist our matching algorithms.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] space-y-2">
            <div className="w-8 h-8 rounded-full bg-white border border-[#E8E8E3] flex items-center justify-center text-[#141413] font-bold text-xs">
              3
            </div>
            <h3 className="font-serif text-sm font-semibold text-[#141413]">
              Defined Career Objectives
            </h3>
            <p className="text-xs text-[#6E6E69] leading-relaxed">
              Clearly specify whether you are seeking gallery representation, high-value residencies, or curatorial grants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

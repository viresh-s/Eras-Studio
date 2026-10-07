'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  FileText,
  User,
  Sparkles,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Paperclip,
  ShieldCheck,
} from 'lucide-react';
import type { CorFullProfile } from '@/types/cor';

interface CorRequestPendingProps {
  submittedAt: string | null;
  fullProfile: CorFullProfile | null;
}

export default function CorRequestPending({
  submittedAt,
  fullProfile,
}: CorRequestPendingProps) {
  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently submitted';

  const personal = fullProfile?.personal;
  const career = fullProfile?.career;
  const skillsCount =
    (fullProfile?.skills?.primary_skills?.length || 0) +
    (fullProfile?.skills?.secondary_skills?.length || 0);
  const expCount = fullProfile?.experience?.length || 0;
  const eduCount = fullProfile?.education?.length || 0;
  const docsCount = fullProfile?.documents?.length || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-3xl p-7 sm:p-10 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF5EC] text-[#865E16] border border-[#EADFCF]">
            <Clock size={13} className="text-[#865E16]" />
            <span>REQUEST UNDER REVIEW</span>
          </div>

          <span className="text-xs text-[#73736C]">
            Submitted on <strong className="text-[#141413]">{formattedDate}</strong>
          </span>
        </div>

        <div className="space-y-2 max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#141413] tracking-tight">
            Your COR request is under review.
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed">
            Thank you for completing the career questionnaire. Our curatorial advisory team is currently reviewing your profile, creative practice, and portfolio materials to establish your institutional profile.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-4">
          <Link
            href="/cor/profile"
            className="px-5 py-2.5 rounded-full bg-[#141413] text-white text-xs font-semibold hover:bg-[#2A2A28] transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FileText size={13} />
            <span>Review or Edit Questionnaire</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Main 2-Column Split: Submitted Summary vs What Happens Next */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Submitted Profile Summary */}
        <div className="lg:col-span-7 bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#F0F0EB] pb-4">
            <h2 className="font-serif text-xl font-semibold text-[#141413]">
              Submitted Profile Overview
            </h2>
            <p className="text-xs text-[#6E6E69] mt-0.5">
              The information our career team is currently evaluating.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#F0F0EB] space-y-1">
              <span className="text-[10px] uppercase font-semibold text-[#8A8A85] flex items-center gap-1.5">
                <User size={12} />
                <span>Candidate</span>
              </span>
              <p className="font-semibold text-sm text-[#141413]">
                {personal?.full_name || 'Creator Profile'}
              </p>
              <p className="text-[#6E6E69]">{personal?.email}</p>
              {personal?.location && (
                <p className="text-[#6E6E69] text-[11px]">{personal.location}</p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#F0F0EB] space-y-1">
              <span className="text-[10px] uppercase font-semibold text-[#8A8A85] flex items-center gap-1.5">
                <Briefcase size={12} />
                <span>Practice & Role</span>
              </span>
              <p className="font-semibold text-sm text-[#141413]">
                {career?.current_role || 'Independent Artist'}
              </p>
              <p className="text-[#6E6E69]">{career?.years_of_experience || '3+ years'}</p>
              <p className="text-[#6E6E69] text-[11px]">{career?.professional_category}</p>
            </div>
          </div>

          {/* Quick Metrics of Submitted Sections */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#F0F0EB] text-center">
              <span className="block text-lg font-serif font-bold text-[#141413]">
                {skillsCount}
              </span>
              <span className="text-[10px] uppercase font-semibold text-[#8A8A85]">
                Skills & Mediums
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#F0F0EB] text-center">
              <span className="block text-lg font-serif font-bold text-[#141413]">
                {expCount}
              </span>
              <span className="text-[10px] uppercase font-semibold text-[#8A8A85]">
                Experience Entries
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#F0F0EB] text-center">
              <span className="block text-lg font-serif font-bold text-[#141413]">
                {eduCount}
              </span>
              <span className="text-[10px] uppercase font-semibold text-[#8A8A85]">
                Education Records
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#F0F0EB] text-center">
              <span className="block text-lg font-serif font-bold text-[#141413]">
                {docsCount}
              </span>
              <span className="text-[10px] uppercase font-semibold text-[#8A8A85]">
                Attached Documents
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-[#EADFCF] flex items-start gap-3">
            <ShieldCheck size={18} className="text-[#865E16] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#5A5A55] leading-relaxed">
              Need to add an updated CV or exhibition link? You can edit your questionnaire at any time. Changes sync automatically for the reviewer.
            </p>
          </div>
        </div>

        {/* Right Column (5 cols): What Happens Next */}
        <div className="lg:col-span-5 bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#F0F0EB] pb-4">
            <h2 className="font-serif text-xl font-semibold text-[#141413]">
              What happens next?
            </h2>
            <p className="text-xs text-[#6E6E69] mt-0.5">
              The curatorial onboarding process explained.
            </p>
          </div>

          <div className="space-y-6 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E8E8E3]">
            <div className="relative group">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-[#141413] bg-[#141413]" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#141413]">
                  1. Curatorial & Portfolio Review
                </span>
                <p className="text-xs text-[#6E6E69] leading-relaxed">
                  Our career advisory team examines your studio practice, art mediums, and current portfolio.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-[#8A8A85] bg-white" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#141413]">
                  2. Institutional Matching
                </span>
                <p className="text-xs text-[#6E6E69] leading-relaxed">
                  We cross-reference your profile with institutional calls, galleries, and private residency programs.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-[#8A8A85] bg-white" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#141413]">
                  3. Membership Activation
                </span>
                <p className="text-xs text-[#6E6E69] leading-relaxed">
                  Once approved, your full COR Member Dashboard unlocks, and our team begins preparing submissions on your behalf.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] text-xs text-[#6E6E69] space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-[#141413]">
              <Sparkles size={13} className="text-[#865E16]" />
              <span>Assigned Reviewer</span>
            </div>
            <p>
              Lead Curator: <strong>Priya Nair</strong> (iRAS Career Advisory Team).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

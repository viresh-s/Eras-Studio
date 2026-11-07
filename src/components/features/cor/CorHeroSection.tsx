import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { CorProfile } from '@/types/cor';
import CorStatusBadge from './CorStatusBadge';

interface CorHeroSectionProps {
  profile: CorProfile | null;
  completeness: number;
}

export default function CorHeroSection({ profile, completeness }: CorHeroSectionProps) {
  const isSubmitted = profile?.submitted_at || profile?.status === 'under_review' || profile?.status === 'active';
  const consultant = profile?.assigned_consultant || 'Priya Nair';

  if (isSubmitted) {
    return (
      <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-3xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CorStatusBadge status={profile?.status || 'active'} size="md" />
              <span className="text-xs text-[#73736C] font-sans font-normal">
                {completeness}% Complete
              </span>
            </div>

            <h2 className="century-heading text-2xl sm:text-3xl text-[#141413]">
              {profile?.status === 'under_review'
                ? 'Your career profile is with our team.'
                : 'Your career profile is active.'}
            </h2>

            <p className="text-xs sm:text-sm text-[#6E6E69] font-sans">
              Assigned consultant: <strong className="font-semibold text-[#141413]">{consultant}</strong>
            </p>
          </div>

          <Link
            href="/cor/profile"
            className="px-5 py-2.5 rounded-full border border-[#141413] text-xs font-medium text-[#141413] hover:bg-neutral-50 transition-colors inline-flex items-center justify-center gap-2 self-start md:self-auto cursor-pointer font-sans"
          >
            <span>Review Career Profile</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Progress Bar at bottom of card */}
        <div className="w-full bg-[#E8E8E3] h-1 rounded-full mt-5 overflow-hidden">
          <div
            className="bg-[#141413] h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.max(completeness, 50)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-3xl p-7 sm:p-10 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-xs">
      <div className="max-w-2xl space-y-5">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-blue-50 text-[#1345EE] border border-blue-200 font-sans">
          <span>{completeness > 0 ? `Profile ${completeness}% Complete` : 'Profile Not Started'}</span>
        </div>

        <h2 className="century-heading text-3xl sm:text-4xl lg:text-5xl text-[#141413] tracking-tight leading-tight">
          Your Next Possibility
        </h2>

        <div>
          <Link
            href="/cor/profile"
            className="px-7 py-3.5 rounded-full bg-[#141413] text-white text-xs sm:text-sm font-medium hover:bg-black transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs font-sans"
          >
            <span>{completeness > 0 ? 'Resume Career Questionnaire' : 'Start Career Questionnaire'}</span>
            <ArrowRight size={15} className="text-white" />
          </Link>
        </div>
      </div>
    </div>
  );
}

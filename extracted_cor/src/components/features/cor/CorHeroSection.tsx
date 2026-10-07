import React from 'react';
import Link from 'next/link';
import { ArrowRight, Briefcase, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';
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
      <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-3xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <CorStatusBadge status={profile?.status || 'under_review'} size="md" />
            <span className="text-xs text-[#73736C]">
              {completeness}% Complete
            </span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#141413]">
            {profile?.status === 'under_review'
              ? 'Your career profile is with our team.'
              : 'Your career profile is active.'}
          </h2>

          <p className="text-xs sm:text-sm text-[#6E6E69] flex items-center gap-1.5">
            <UserCheck size={14} className="text-[#865E16]" />
            <span>Assigned consultant: <strong className="text-[#141413]">{consultant}</strong></span>
          </p>
        </div>

        <Link
          href="/cor/profile"
          className="px-6 py-3 rounded-full border border-[#141413] text-xs sm:text-sm font-medium text-[#141413] hover:bg-neutral-50 transition-colors inline-flex items-center justify-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <span>Review Career Profile</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-3xl p-7 sm:p-10 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-xs">
      <div className="max-w-2xl space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-[#FAF5EC] text-[#865E16] border border-[#EADFCF]">
          <Sparkles size={11} className="text-[#865E16]" />
          <span>{completeness > 0 ? `Profile ${completeness}% Complete` : 'Your Profile is Not Started'}</span>
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#141413] tracking-tight leading-tight">
          More than your next job.
          <br />
          <em className="font-serif font-normal italic text-[#6E6E69]">Your next possibility.</em>
        </h2>

        <p className="text-xs sm:text-sm text-[#6E6E69] leading-relaxed max-w-xl font-normal">
          Tell us about your skills, experience and ambitions. The iRAS career team will review your profile and help you find your direction.
        </p>

        <div className="pt-2">
          <Link
            href="/cor/profile"
            className="px-7 py-3.5 rounded-full bg-[#141413] text-white text-xs sm:text-sm font-medium hover:bg-[#2A2A28] active:bg-black transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span>{completeness > 0 ? 'Resume Career Questionnaire' : 'Start Career Questionnaire'}</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-center justify-center w-52 h-52 rounded-full border border-dashed border-[#D5D3CE] p-6 text-center bg-white shadow-2xs">
        <div className="w-14 h-14 rounded-full bg-[#FAF9F6] flex items-center justify-center text-[#141413] mb-3 border border-[#E8E8E3]">
          <Briefcase size={26} />
        </div>
        <p className="text-[10px] tracking-widest uppercase text-[#8A8A85] font-semibold">
          CAREER / COMMUNITY / CREATIVITY
        </p>
      </div>
    </div>
  );
}

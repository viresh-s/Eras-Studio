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

            <h2 className="font-sans font-semibold text-2xl sm:text-3xl text-[#141413] tracking-tight">
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
            style={{
              position: 'relative',
              background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
              boxShadow: '0px 7px 22px rgba(35, 77, 255, 0.18), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
              borderRadius: 9999,
              outline: '2px #2356FF solid',
              outlineOffset: '-2px',
            }}
            className="btn-premium-gradient-pill px-6 py-2.5 text-xs font-semibold text-white hover:brightness-110 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 self-start md:self-auto cursor-pointer font-sans shadow-xs select-none"
          >
            <span>Review Career Profile</span>
            <ArrowRight size={13} className="text-white" />
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

        <h2 className="font-sans font-semibold text-3xl sm:text-4xl lg:text-5xl text-[#141413] tracking-tight leading-tight">
          Your Next Possibility
        </h2>

        <div>
          <Link
            href="/cor/profile"
            style={{
              position: 'relative',
              background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
              boxShadow: '0px 7px 22px rgba(35, 77, 255, 0.22), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
              borderRadius: 9999,
              outline: '2px #2356FF solid',
              outlineOffset: '-2px',
            }}
            className="btn-premium-gradient-pill px-7 py-3.5 text-white text-xs sm:text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs font-sans select-none"
          >
            <span>{completeness > 0 ? 'Resume Career Questionnaire' : 'Start Career Questionnaire'}</span>
            <ArrowRight size={15} className="text-white" />
          </Link>
        </div>
      </div>
    </div>
  );
}

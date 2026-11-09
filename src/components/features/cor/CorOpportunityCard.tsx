import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { CorOpportunity } from '@/types/cor';

interface CorOpportunityCardProps {
  opportunity: CorOpportunity;
  isApplied?: boolean;
}

export default function CorOpportunityCard({ opportunity, isApplied = false }: CorOpportunityCardProps) {
  return (
    <div className="bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-7 hover:border-[#D5D3CE] hover:shadow-xs transition-all flex flex-col justify-between">
      <div>
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#141413] text-[#FAF5EC]">
              <span>{opportunity.workplace_type}</span>
            </span>

            {opportunity.match_reasons && opportunity.match_reasons.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#FAF5EC] text-[#865E16] border border-[#EADFCF]">
                {opportunity.match_reasons[0]}
              </span>
            )}
          </div>

          <span className="text-[11px] font-semibold text-[#141413]">
            {opportunity.salary_range}
          </span>
        </div>

        {/* Title & Company */}
        <h3 className="font-sans text-xl sm:text-2xl font-medium text-[#141413] leading-snug">
          {opportunity.role}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6E6E69] mt-2 mb-3.5 font-sans">
          <span className="font-semibold text-[#141413] font-sans">
            {opportunity.company}
          </span>
          <span className="font-sans">
            {opportunity.location}
          </span>
        </div>

        {/* Description snippet */}
        <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed line-clamp-3 mb-4 font-normal font-sans">
          {opportunity.description}
        </p>

        {/* Skills Pills */}
        {opportunity.skills && opportunity.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {opportunity.skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-[#FAF9F6] border border-[#E8E8E3] text-[10px] font-medium text-[#5A5A55] font-sans"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Row */}
      <div className="pt-4 border-t border-[#F0F0EB] flex items-center justify-between gap-3">
        <Link
          href={`/cor/opportunities/${opportunity.id}`}
          className="text-xs font-semibold text-[#141413] hover:text-black transition-colors font-sans"
        >
          View Details →
        </Link>

        {isApplied ? (
          <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#EAF2EC] text-[#28633B] text-xs font-medium border border-[#CCE2D2] font-sans">
            <CheckCircle2 size={13} />
            <span>In Pipeline</span>
          </span>
        ) : (
          <Link
            href={`/cor/opportunities/${opportunity.id}`}
            style={{
              position: 'relative',
              background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
              boxShadow: '0px 4px 14px rgba(35, 77, 255, 0.2), 0px 2px 2px rgba(255, 255, 255, 0.65) inset, 0px -2px 4px rgba(6, 42, 137, 0.33) inset',
              borderRadius: 9999,
              outline: '2px #2356FF solid',
              outlineOffset: '-2px',
            }}
            className="btn-premium-gradient-pill px-4 py-2 text-white text-xs font-medium hover:brightness-110 active:scale-[0.98] transition-all inline-flex items-center gap-1.5 shadow-xs font-sans select-none"
          >
            <span>Apply Now</span>
            <ArrowRight size={12} className="text-white" />
          </Link>
        )}
      </div>
    </div>
  );
}

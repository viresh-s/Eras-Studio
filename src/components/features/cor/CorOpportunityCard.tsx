import React from 'react';
import Link from 'next/link';
import { Building, MapPin, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
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
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#141413] text-[#FAF5EC]">
              <Sparkles size={10} className="text-[#FBBF24]" />
              <span>{opportunity.workplace_type}</span>
            </span>

            {opportunity.match_reasons && opportunity.match_reasons.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#FAF5EC] text-[#865E16] border border-[#EADFCF]">
                {opportunity.match_reasons[0]}
              </span>
            )}
          </div>

          <span className="text-[11px] font-semibold text-[#141413]">
            {opportunity.salary_range}
          </span>
        </div>

        {/* Title & Company */}
        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#141413] leading-snug">
          {opportunity.role}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6E6E69] mt-2 mb-3.5">
          <span className="flex items-center gap-1.5 font-medium text-[#141413]">
            <Building size={13} className="text-[#8A8A85]" />
            {opportunity.company}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={13} className="text-[#8A8A85]" />
            {opportunity.location}
          </span>
        </div>

        {/* Description snippet */}
        <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed line-clamp-3 mb-4 font-normal">
          {opportunity.description}
        </p>

        {/* Skills Pills */}
        {opportunity.skills && opportunity.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {opportunity.skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-[#FAF9F6] border border-[#E8E8E3] text-[10px] font-medium text-[#5A5A55]"
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
          className="text-xs font-medium text-[#6E6E69] hover:text-[#141413] transition-colors"
        >
          View Details
        </Link>

        {isApplied ? (
          <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#EAF2EC] text-[#28633B] text-xs font-medium border border-[#CCE2D2]">
            <CheckCircle2 size={13} />
            <span>In Pipeline</span>
          </span>
        ) : (
          <Link
            href={`/cor/opportunities/${opportunity.id}`}
            className="px-4 py-2 rounded-full bg-[#141413] text-white text-xs font-medium hover:bg-[#2A2A28] active:bg-black transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <span>Apply Now</span>
            <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}

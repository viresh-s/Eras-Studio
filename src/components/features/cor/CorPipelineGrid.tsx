import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { CorApplicationStage } from '@/types/cor';
import { COR_APPLICATION_STAGES } from '@/types/cor';

interface CorPipelineGridProps {
  counts: Record<CorApplicationStage, number>;
}

export default function CorPipelineGrid({ counts }: CorPipelineGridProps) {
  return (
    <div className="bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-7 my-8 shadow-xs">
      <div className="flex items-center justify-between pb-5 border-b border-[#F0F0EB] mb-6">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#141413]">
            Your application pipeline
          </h2>
          <p className="text-xs text-[#6E6E69] mt-0.5">
            Stage distribution across all current submissions and recommendations.
          </p>
        </div>

        <Link
          href="/cor/applications"
          className="text-xs font-semibold text-[#141413] hover:text-black inline-flex items-center gap-1 group transition-colors"
        >
          <span>View Application Tracker</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {COR_APPLICATION_STAGES.map((stage) => {
          const count = counts[stage] || 0;
          const hasCount = count > 0;

          return (
            <Link
              key={stage}
              href={`/cor/applications?stage=${encodeURIComponent(stage)}`}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[92px] ${
                hasCount
                  ? 'bg-[#FAF9F6] border-[#141413] text-[#141413]'
                  : 'bg-white border-[#E8E8E3] text-[#8A8A85] hover:border-[#D5D3CE]'
              }`}
            >
              <span className="text-[11px] font-medium leading-tight line-clamp-2">
                {stage}
              </span>
              <strong className="font-serif text-2xl font-semibold mt-2">
                {count}
              </strong>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

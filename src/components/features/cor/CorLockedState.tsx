'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CorLockedStateProps {
  isPaused?: boolean;
}

const benefits = [
  { title: 'Career Profile Review' },
  { title: 'Opportunity Discovery' },
  { title: 'Application Assistance' },
  { title: 'Job Tracking' },
  { title: 'Consultation Calls' },
];

export default function CorLockedState({ isPaused = false }: CorLockedStateProps) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in duration-300">
      <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-3xl p-8 sm:p-14 text-center shadow-xs">
        {/* Badge */}
        <div className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#141413] text-[#FAF5EC] mb-6">
          <span>Pro Tier Required</span>
        </div>

        {/* Title */}
        <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#141413] tracking-tight leading-tight max-w-2xl mx-auto">
          {isPaused ? 'COR is temporarily paused.' : 'Turn your portfolio into opportunities.'}
        </h1>

        {/* Benefit Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-10 text-left">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="bg-white border border-[#E8E8E3] rounded-2xl p-5 hover:border-[#D5D3CE] transition-all"
            >
              <h3 className="font-serif text-base font-semibold text-[#141413]">
                {b.title}
              </h3>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        {!isPaused && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/subscription"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#141413] text-white text-sm font-medium hover:bg-[#2A2A28] active:bg-black transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
            >
              <span>Upgrade to PRO</span>
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/portfolio"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-[#E8E8E3] text-xs sm:text-sm font-medium text-[#6E6E69] hover:bg-neutral-50 transition-colors inline-flex items-center justify-center"
            >
              Back to Portfolio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

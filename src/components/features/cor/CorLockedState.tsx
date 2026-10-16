'use client';

import React from 'react';
import Link from 'next/link';
import {
  Lock,
  Sparkles,
  ArrowRight,
  UserCheck,
  Search,
  Layers,
  Briefcase,
  Calendar,
} from 'lucide-react';

interface CorLockedStateProps {
  isPaused?: boolean;
}

const benefits = [
  {
    icon: UserCheck,
    title: 'Career Profile Review',
    desc: 'Comprehensive evaluation of your artistic practice, medium, and ambitions.',
  },
  {
    icon: Search,
    title: 'Opportunity Discovery',
    desc: 'Targeted matching with institutional exhibitions, residencies, and grants.',
  },
  {
    icon: Layers,
    title: 'Application Assistance',
    desc: 'Curatorial guidance on statements, portfolios, and submission readiness.',
  },
  {
    icon: Briefcase,
    title: 'Job Tracking',
    desc: 'Transparent real-time pipeline monitoring across all interview stages.',
  },
  {
    icon: Calendar,
    title: 'Consultation Calls',
    desc: 'Direct 1-on-1 strategy sessions with experienced career advisors.',
  },
];

export default function CorLockedState({ isPaused = false }: CorLockedStateProps) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in duration-300">
      <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-3xl p-8 sm:p-14 text-center shadow-xs">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-full bg-[#141413] text-white flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Lock size={28} className="text-[#FAF5EC]" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#141413] text-[#FAF5EC] mb-4">
          <Sparkles size={12} className="text-[#FBBF24]" />
          <span>Exclusively for Pro</span>
        </div>

        {/* Title & Description */}
        <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#141413] tracking-tight leading-tight max-w-2xl mx-auto">
          {isPaused ? 'COR is temporarily paused.' : 'Turn your portfolio into opportunities.'}
        </h1>

        <p className="text-sm sm:text-base text-[#6E6E69] mt-4 max-w-xl mx-auto leading-relaxed">
          {isPaused
            ? 'The prototype administrator has paused COR in platform settings.'
            : 'A dedicated career team helps you prepare your profile, identify suitable opportunities, and move applications forward.'}
        </p>

        {/* Benefit Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-10 text-left">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={i}
                className="bg-white border border-[#E8E8E3] rounded-2xl p-5 hover:border-[#D5D3CE] transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FAF9F6] border border-[#E8E8E3] flex items-center justify-center text-[#141413] mb-3">
                  <Icon size={18} />
                </div>
                <h3 className="font-serif text-base font-semibold text-[#141413] mb-1">
                  {b.title}
                </h3>
                <p className="text-xs text-[#6E6E69] leading-relaxed font-sans">
                  {b.desc}
                </p>
              </div>
            );
          })}
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

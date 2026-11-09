'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Briefcase, Compass, FileCheck, Calendar, ShieldCheck, Check } from 'lucide-react';

interface CorLockedStateProps {
  isPaused?: boolean;
}

const benefits = [
  {
    icon: Compass,
    title: 'Career Profile Review',
    desc: 'Comprehensive portfolio review and positioning strategy by curatorial advisors.',
  },
  {
    icon: Sparkles,
    title: 'Opportunity Discovery',
    desc: 'Access curated open calls, prestigious residencies, grants, and high-value commissions.',
  },
  {
    icon: FileCheck,
    title: 'Application Assistance',
    desc: 'Personalized curatorial guidance to refine your proposals, artist statements, and dossiers.',
  },
  {
    icon: Briefcase,
    title: 'Direct Job & Exhibition Tracking',
    desc: 'Manage and follow through on institutional opportunities with live pipeline tools.',
  },
  {
    icon: Calendar,
    title: '1-on-1 Consultation Calls',
    desc: 'Schedule strategic sessions with industry specialists to expand your collector network.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Artist Badge',
    desc: 'Stand out in Discovery and searches with official Eras Studio Pro verification.',
  },
];

export default function CorLockedState({ isPaused = false }: CorLockedStateProps) {
  return (
    <div
      className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 animate-in fade-in duration-300"
      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
    >
      <div className="bg-white border border-[#EBEBE6] rounded-3xl p-8 sm:p-14 text-center shadow-xs">
        {/* Pro Pill Badge */}
        <div className="inline-flex items-center gap-2 mb-6">
          <span
            style={{
              background:
                'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%) border-box',
              border: '1.5px solid transparent',
            }}
            className="h-8 px-4 rounded-full inline-flex items-center gap-1.5 text-xs font-medium text-[#1345EE] shadow-2xs"
          >
            <Sparkles size={13} className="text-[#1345EE]" />
            <span className="uppercase tracking-wider">COR Pro Membership</span>
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-3xl sm:text-5xl font-serif italic font-semibold text-[#141413] tracking-tight leading-tight max-w-2xl mx-auto"
          style={{
            fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
            fontStyle: 'italic',
          }}
        >
          {isPaused ? 'COR Hub is temporarily paused' : 'Turn your portfolio into institutional opportunities'}
        </h1>

        <p className="text-xs sm:text-sm text-gray-600 font-normal mt-3 max-w-xl mx-auto leading-relaxed">
          Human guidance. Thoughtful curatorial opportunities. A clearer, elevated way forward for dedicated artists, creators, and collectors.
        </p>

        {/* Benefit Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-10 text-left">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={i}
                className="bg-[#FAFAF8] border border-[#EBEBE6] rounded-2xl p-5 hover:border-[#2356FF]/50 hover:bg-white hover:shadow-xs transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-[#EBEBE6] flex items-center justify-center text-[#1345EE] mb-3 group-hover:scale-105 transition-transform">
                  <Icon size={16} />
                </div>
                <h3 className="text-sm font-medium text-[#141413] mb-1">
                  {b.title}
                </h3>
                <p className="text-xs text-gray-500 font-normal leading-relaxed">
                  {b.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Plan summary chip */}
        <div className="inline-flex items-center gap-2 p-1.5 pr-4 rounded-full bg-[#F4F4F0] border border-[#E5E7EB] mb-8 text-xs text-gray-700">
          <span className="px-2.5 py-0.5 rounded-full bg-white text-[#1345EE] font-semibold text-[11px] shadow-2xs">
            PRO TIER
          </span>
          <span>₹999 / month • Unlimited artworks + full COR access</span>
        </div>

        {/* CTA Buttons */}
        {!isPaused && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/subscription"
              style={{
                position: 'relative',
                background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                boxShadow:
                  '0px 7px 22px rgba(35, 77, 255, 0.13), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
                overflow: 'hidden',
                borderRadius: 40,
                outline: '2px #2356FF solid',
                outlineOffset: '-2px',
              }}
              className="w-full sm:w-auto px-8 py-3.5 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98] select-none shadow-md group"
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 3,
                  borderRadius: 37,
                  border: '1px rgba(255, 255, 255, 0.15) solid',
                  pointerEvents: 'none',
                }}
              />
              <span className="text-white text-sm font-normal relative z-10 flex items-center gap-2">
                <span>Upgrade to Pro</span>
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link
              href="/portfolio"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-[#EBEBE6] text-xs sm:text-sm font-normal text-gray-700 hover:bg-[#F4F4F0] hover:text-black transition-colors inline-flex items-center justify-center"
            >
              Back to Portfolio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

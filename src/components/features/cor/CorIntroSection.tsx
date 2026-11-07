'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CorIntroSectionProps {
  onStartClick?: () => void;
}

export default function CorIntroSection({ onStartClick }: CorIntroSectionProps) {
  const benefits = [
    { num: '01', title: 'CAREER PROFILE REVIEW' },
    { num: '02', title: 'OPPORTUNITY DISCOVERY' },
    { num: '03', title: 'APPLICATION ASSISTANCE' },
    { num: '04', title: 'APPLICATION TRACKING' },
    { num: '05', title: '1—ON—1 CONSULTATION' },
  ];

  const processSteps = [
    { num: '01', title: 'SUBMIT QUESTIONNAIRE' },
    { num: '02', title: 'CURATORIAL REVIEW' },
    { num: '03', title: 'WE APPLY FOR YOU' },
    { num: '04', title: 'TRACK YOUR PIPELINE' },
  ];

  return (
    <div className="space-y-24 sm:space-y-32 py-4 sm:py-8 animate-in fade-in duration-500 text-[#141413]">
      {/* 1. HERO / COR INTRODUCTION */}
      <section
        aria-label="COR Introduction"
        className="relative rounded-2xl sm:rounded-3xl bg-[#FAF9F6] border border-[#E8E8E3] p-8 sm:p-12 md:p-16 lg:p-20 overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          <div className="lg:col-span-7 space-y-7">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[66px] font-normal tracking-tight text-[#141413] leading-[1.02] max-w-[680px]">
              Turn your portfolio <br className="hidden sm:inline" />
              into <span className="italic font-serif">opportunities.</span>
            </h1>

            <div className="pt-2">
              <Link
                href="/cor/profile"
                onClick={onStartClick}
                style={{
                  position: 'relative',
                  background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                  boxShadow: '0px 7px 22px rgba(35, 77, 255, 0.22), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
                  borderRadius: 40,
                  outline: '2px #2356FF solid',
                  outlineOffset: '-2px',
                }}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-white text-sm sm:text-base font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-md cursor-pointer select-none"
              >
                <span>Apply for COR Membership</span>
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-1 text-white"
                />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] rounded-2xl overflow-hidden bg-[#E8E8E3] border border-[#DDDCD7]">
              <img
                src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop"
                alt="Curated contemporary artwork"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. MEMBERSHIP PRIVILEGES */}
      <section aria-label="Membership Privileges" className="px-2 sm:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#141413] leading-[1.08] tracking-tight">
              What you receive as a COR Member.
            </h2>
          </div>

          <div className="lg:col-span-7 divide-y divide-[#E8E8E3] border-t border-b border-[#E8E8E3]">
            {benefits.map((item) => (
              <div
                key={item.num}
                className="py-7 sm:py-8 group transition-colors duration-150 hover:bg-[#FAF9F6] px-4 -mx-4 rounded-xl"
              >
                <div className="flex items-center gap-6 sm:gap-8">
                  <span className="font-mono text-xs sm:text-sm text-[#1345EE] font-semibold tracking-wider flex-shrink-0">
                    {item.num}
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-medium text-[#141413] tracking-tight">
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. HOW COR WORKS FOR CREATORS */}
      <section aria-label="Curatorial Workflow" className="px-2 sm:px-4 space-y-12 sm:space-y-16">
        <div className="max-w-2xl">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#141413] leading-[1.08] tracking-tight">
            Curatorial Workflow
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 pt-4 border-t border-[#E8E8E3]">
          {processSteps.map((step) => (
            <div key={step.num} className="relative pt-6 space-y-3">
              <span className="font-serif text-3xl sm:text-4xl font-normal text-[#141413] block">
                {step.num}
              </span>
              <h3 className="font-serif text-base sm:text-lg font-medium text-[#141413] tracking-tight">
                {step.title}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* 4. EDITORIAL CTA BLOCK */}
      <section aria-label="Begin COR Application" className="px-2 sm:px-4">
        <div className="relative rounded-2xl sm:rounded-3xl bg-[#141413] text-[#FAF9F6] p-8 sm:p-14 md:p-16 lg:p-20 overflow-hidden">
          <div className="max-w-2xl space-y-8">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#FAF9F6] leading-[1.08] tracking-tight">
              A stronger portfolio deserves a stronger opportunity pipeline.
            </h2>

            <div>
              <Link
                href="/cor/profile"
                onClick={onStartClick}
                style={{
                  position: 'relative',
                  background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                  boxShadow: '0px 7px 22px rgba(35, 77, 255, 0.22), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
                  borderRadius: 40,
                  outline: '2px #2356FF solid',
                  outlineOffset: '-2px',
                }}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-white text-sm sm:text-base font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-md cursor-pointer select-none"
              >
                <span>Apply for COR Membership</span>
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-1 text-white"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

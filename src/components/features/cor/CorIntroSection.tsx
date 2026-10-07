'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface CorIntroSectionProps {
  onStartClick?: () => void;
}

export default function CorIntroSection({ onStartClick }: CorIntroSectionProps) {
  const benefits = [
    {
      num: '01',
      title: 'CAREER PROFILE REVIEW',
      description:
        'We review your practice, experience, portfolio, and goals to build a stronger institutional profile.',
    },
    {
      num: '02',
      title: 'OPPORTUNITY DISCOVERY',
      description:
        'We identify relevant gallery calls, commissions, residencies, and other opportunities.',
    },
    {
      num: '03',
      title: 'APPLICATION ASSISTANCE',
      description:
        'When there is a strong match, the COR team prepares and submits the application for you.',
    },
    {
      num: '04',
      title: 'APPLICATION TRACKING',
      description:
        'Follow every application through screening, interviews, final rounds, and offers.',
    },
    {
      num: '05',
      title: '1—ON—1 CONSULTATION',
      description:
        'Discuss your practice, opportunities, and career direction with your advisor.',
    },
  ];

  const processSteps = [
    {
      num: '01',
      title: 'SUBMIT QUESTIONNAIRE',
      description: 'Share your practice, experience, and creative goals.',
    },
    {
      num: '02',
      title: 'CURATORIAL REVIEW',
      description: 'We assess your profile against relevant institutional calls.',
    },
    {
      num: '03',
      title: 'WE APPLY FOR YOU',
      description: 'When there is a strong match, COR submits on your behalf.',
    },
    {
      num: '04',
      title: 'TRACK YOUR PIPELINE',
      description: 'Follow every stage from screening to interviews and offer.',
    },
  ];

  return (
    <div className="space-y-24 sm:space-y-32 py-4 sm:py-8 animate-in fade-in duration-500 text-[#141413]">
      {/* ============================================================ */}
      {/* 1. HERO / COR INTRODUCTION (Asymmetric Editorial Layout)     */}
      {/* ============================================================ */}
      <section
        aria-label="COR Introduction"
        className="relative rounded-2xl sm:rounded-3xl bg-[#FAF9F6] border border-[#E8E8E3] p-8 sm:p-12 md:p-16 lg:p-20 overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column (Hero Content) */}
          <div className="lg:col-span-7 space-y-7">
            {/* Editorial Typographic Label (No pill badges) */}
            <div className="flex items-center gap-3 text-xs tracking-[0.22em] uppercase font-semibold text-[#865E16]">
              <span>01</span>
              <span className="w-8 h-px bg-[#D5D3CE]" />
              <span>CAREER OPPORTUNITY RESOURCE · COR</span>
            </div>

            {/* Display Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[66px] font-normal tracking-tight text-[#141413] leading-[1.02] max-w-[680px]">
              Turn your portfolio <br className="hidden sm:inline" />
              into <span className="italic font-serif">opportunities.</span>
            </h1>

            {/* Supporting Institutional Paragraph */}
            <p className="text-base sm:text-lg text-[#5A5A55] leading-relaxed max-w-[560px] font-sans font-normal">
              COR is an advisor-led career service for artists and visual creators.
              We identify opportunities that fit your practice and handle the application process with you.
            </p>

            {/* Primary CTA + Supporting Detail */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <Link
                href="/cor/profile"
                onClick={onStartClick}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#141413] text-[#FAF9F6] text-sm sm:text-base font-medium hover:bg-[#2A2A28] active:bg-black transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#141413] focus:ring-offset-2 cursor-pointer"
              >
                <span>Apply for COR Membership</span>
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>

              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#73736C] font-mono">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#865E16]" />
                <span>Application approximately 5 minutes</span>
              </div>
            </div>
          </div>

          {/* Right Column (Editorial Art Visual Plate) */}
          <div className="lg:col-span-5">
            <div className="relative group">
              <div className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] rounded-2xl overflow-hidden bg-[#E8E8E3] border border-[#DDDCD7] shadow-[0_12px_36px_rgba(0,0,0,0.06)]">
                <img
                  src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop"
                  alt="Curated contemporary artwork and institutional gallery presentation"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                {/* Editorial Art Plate Caption */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-white/60 text-left shadow-xs">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#865E16] mb-0.5">
                    <span>Curatorial Advisory</span>
                    <span>Series I</span>
                  </div>
                  <p className="text-xs font-serif font-medium text-[#141413]">
                    Institutional open calls, museum grants & gallery acquisitions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. "WHAT YOU RECEIVE AS A COR MEMBER" (Editorial Benefits)   */}
      {/* ============================================================ */}
      <section aria-label="Membership Privileges" className="px-2 sm:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column (Editorial Title & Overview) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="flex items-center gap-3 text-xs tracking-[0.22em] uppercase font-semibold text-[#865E16]">
              <span>02</span>
              <span className="w-8 h-px bg-[#D5D3CE]" />
              <span>MEMBERSHIP PRIVILEGES</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#141413] leading-[1.08] tracking-tight">
              What you receive as a COR Member.
            </h2>

            <p className="text-sm sm:text-base text-[#5A5A55] leading-relaxed max-w-sm">
              Full-service career support designed to sustain and advance your creative practice.
            </p>

            {/* Single Membership Inclusion Note at Bottom (Removes repetition) */}
            <div className="pt-6 border-t border-[#E8E8E3] flex items-center gap-2.5 text-xs font-medium text-[#28633B]">
              <CheckCircle2 size={16} className="text-[#28633B] flex-shrink-0" />
              <span>All services listed above are included with COR membership.</span>
            </div>
          </div>

          {/* Right Column (Editorial Numbered Rows with Thin Separators) */}
          <div className="lg:col-span-7 divide-y divide-[#E8E8E3] border-t border-b border-[#E8E8E3]">
            {benefits.map((item) => (
              <div
                key={item.num}
                className="py-7 sm:py-8 group transition-colors duration-150 hover:bg-[#FAF9F6] px-4 -mx-4 rounded-xl"
              >
                <div className="flex items-start gap-6 sm:gap-8">
                  <span className="font-mono text-xs sm:text-sm text-[#865E16] font-semibold tracking-wider pt-1 flex-shrink-0">
                    {item.num}
                  </span>

                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-serif text-lg sm:text-xl font-medium text-[#141413] tracking-tight group-hover:text-black transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. "HOW COR WORKS FOR CREATORS" (Editorial Process Timeline) */}
      {/* ============================================================ */}
      <section aria-label="Curatorial Workflow" className="px-2 sm:px-4 space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-3 text-xs tracking-[0.22em] uppercase font-semibold text-[#865E16]">
            <span>03</span>
            <span className="w-8 h-px bg-[#D5D3CE]" />
            <span>HOW COR WORKS FOR CREATORS</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#141413] leading-[1.08] tracking-tight">
            Human guidance. We do the application legwork.
          </h2>

          <p className="text-sm sm:text-base text-[#5A5A55] leading-relaxed">
            COR is not a job board. We identify relevant opportunities, assess the fit, and handle the application process on your behalf.
          </p>
        </div>

        {/* 4-Step Editorial Process Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 pt-4 border-t border-[#E8E8E3]">
          {processSteps.map((step, idx) => (
            <div key={step.num} className="relative pt-6 space-y-4 group">
              {/* Subtle Step Progress Line */}
              <div className="hidden lg:block absolute top-0 left-0 right-0 h-px bg-[#E8E8E3]">
                <div className="w-8 h-px bg-[#141413]" />
              </div>

              {/* Typographic Step Number */}
              <div className="flex items-center justify-between">
                <span className="font-serif text-3xl sm:text-4xl font-normal text-[#141413]">
                  {step.num}
                </span>
                {idx < processSteps.length - 1 && (
                  <span className="text-[#C5C4BE] font-mono text-xs hidden lg:inline">→</span>
                )}
              </div>

              {/* Step Title & Description */}
              <div className="space-y-2">
                <h3 className="font-serif text-base sm:text-lg font-medium text-[#141413] tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. EDITORIAL CTA BLOCK ("READY TO BEGIN?")                    */}
      {/* ============================================================ */}
      <section aria-label="Begin COR Application" className="px-2 sm:px-4">
        <div className="relative rounded-2xl sm:rounded-3xl bg-[#141413] text-[#FAF9F6] p-8 sm:p-14 md:p-16 lg:p-20 overflow-hidden">
          <div className="max-w-2xl space-y-6">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#D4AF37]">
              READY TO BEGIN?
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#FAF9F6] leading-[1.08] tracking-tight">
              A stronger portfolio deserves a stronger opportunity pipeline.
            </h2>

            <p className="text-sm sm:text-base text-[#A8A8A2] leading-relaxed">
              Join visual creators navigating open calls, museum commissions, and residencies with dedicated advisor backing.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <Link
                href="/cor/profile"
                onClick={onStartClick}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#FAF9F6] text-[#141413] text-sm sm:text-base font-semibold hover:bg-white active:bg-[#E8E8E3] transition-all duration-200 shadow-sm cursor-pointer"
              >
                <span>Apply for COR Membership</span>
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>

              <span className="text-xs font-mono uppercase tracking-wider text-[#8A8A85]">
                The application takes approximately 5 minutes.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

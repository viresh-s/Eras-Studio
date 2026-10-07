'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Compass,
  FileCheck2,
  Send,
  Kanban,
  Headphones,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface CorIntroSectionProps {
  onStartClick?: () => void;
}

export default function CorIntroSection({ onStartClick }: CorIntroSectionProps) {
  const features = [
    {
      icon: FileCheck2,
      title: 'Career Profile Review',
      badge: 'Step 1',
      description:
        'Our curatorial team reviews your body of work, medium specialisation, exhibition history, and creative goals to build your institutional profile.',
    },
    {
      icon: Compass,
      title: 'Opportunity Discovery',
      badge: 'Step 2',
      description:
        'We match your practice against verified gallery calls, museum commissions, and international artist-in-residence opportunities.',
    },
    {
      icon: Send,
      title: 'Application Assistance',
      badge: 'Admin Managed',
      description:
        'You never need to apply alone. When a strong match is identified, our career advisors prepare and submit tailored applications on your behalf.',
    },
    {
      icon: Kanban,
      title: 'Job & Application Tracking',
      badge: 'Real-time',
      description:
        'Track every submission with a live audit trail of curatorial stage movements from initial screening to interviews and offers.',
    },
    {
      icon: Headphones,
      title: 'Consultation Calls',
      badge: '1-on-1',
      description:
        'Schedule dedicated 30-minute strategic sessions with your assigned career advisor to review portfolio direction and curatorial feedback.',
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#FAF9F6] border border-[#E8E8E3] p-8 sm:p-12 md:p-16">
        <div className="max-w-2xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141413] text-white text-xs font-semibold tracking-wide">
            <Sparkles size={13} className="text-[#FBBF24]" />
            <span>CAREER OPPORTUNITY RESOURCE · COR</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-[#141413] tracking-tight leading-[1.15]">
            Turn your portfolio into opportunities.
          </h1>

          <p className="text-sm sm:text-base text-[#5A5A55] leading-relaxed max-w-xl">
            COR is an advisor-led career service built for artists and visual creators.
            Our dedicated team pairs your studio practice with institutional open calls,
            gallery representation, and residencies — then applies directly on your behalf.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/cor/profile"
              onClick={onStartClick}
              className="px-7 py-3.5 rounded-full bg-[#141413] text-white text-xs sm:text-sm font-semibold hover:bg-[#2A2A28] active:bg-black transition-colors inline-flex items-center gap-2.5 shadow-sm cursor-pointer group"
            >
              <span>Apply for COR Membership</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <span className="text-xs text-[#73736C] flex items-center gap-1.5">
              <Clock size={14} className="text-[#8A8A85]" />
              Takes ~5 mins to complete
            </span>
          </div>
        </div>

        {/* Decorative background watermark */}
        <div className="absolute -right-8 -bottom-10 opacity-5 pointer-events-none select-none hidden md:block">
          <span className="font-serif text-[180px] font-bold text-[#141413]">COR</span>
        </div>
      </div>

      {/* How It Works Workflow Summary */}
      <div className="bg-white border border-[#E8E8E3] rounded-3xl p-7 sm:p-9 space-y-6">
        <div className="border-b border-[#F0F0EB] pb-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#865E16]">
            HOW COR WORKS FOR CREATORS
          </span>
          <h2 className="font-serif text-2xl font-semibold text-[#141413] mt-1">
            Human guidance. We do the application legwork.
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6E69] mt-1">
            Unlike traditional job boards where creators submit countless blind applications,
            our curatorial team handles the discovery and submission for you.
          </p>
        </div>

        {/* 4 Workflow Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] space-y-2">
            <div className="w-7 h-7 rounded-full bg-[#141413] text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
            <h3 className="font-serif text-sm font-semibold text-[#141413]">
              Submit Questionnaire
            </h3>
            <p className="text-xs text-[#6E6E69] leading-relaxed">
              Share your creative mediums, career experience, education, CV, and desired opportunities.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] space-y-2">
            <div className="w-7 h-7 rounded-full bg-[#141413] text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h3 className="font-serif text-sm font-semibold text-[#141413]">
              Curatorial Review
            </h3>
            <p className="text-xs text-[#6E6E69] leading-relaxed">
              Our career specialist reviews your submission to evaluate alignment with current curatorial calls.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] space-y-2">
            <div className="w-7 h-7 rounded-full bg-[#141413] text-white flex items-center justify-center text-xs font-bold">
              3
            </div>
            <h3 className="font-serif text-sm font-semibold text-[#141413]">
              We Apply For You
            </h3>
            <p className="text-xs text-[#6E6E69] leading-relaxed">
              When matched with a residency, gallery, or grant, the COR team submits directly on your behalf.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] space-y-2">
            <div className="w-7 h-7 rounded-full bg-[#141413] text-white flex items-center justify-center text-xs font-bold">
              4
            </div>
            <h3 className="font-serif text-sm font-semibold text-[#141413]">
              Track Your Pipeline
            </h3>
            <p className="text-xs text-[#6E6E69] leading-relaxed">
              Follow every stage update, interview invitation, and offer directly from your member dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#141413]">
            What you receive as a COR Member
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6E69] mt-0.5">
            Full-service career support dedicated to sustaining your creative practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-7 shadow-xs hover:border-[#141413] transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] flex items-center justify-center text-[#141413]">
                      <Icon size={18} />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF5EC] text-[#865E16] border border-[#EADFCF]">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-semibold text-[#141413]">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#5A5A55] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-medium text-[#28633B]">
                  <CheckCircle2 size={13} />
                  <span>Included with Membership</span>
                </div>
              </div>
            );
          })}

          {/* Quick Start Card */}
          <div className="bg-[#141413] text-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FBBF24]">
                READY TO BEGIN
              </span>
              <h3 className="font-serif text-lg font-semibold text-white">
                Start your questionnaire today.
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Save your progress at any time and return whenever convenient.
              </p>
            </div>

            <Link
              href="/cor/profile"
              onClick={onStartClick}
              className="w-full py-3 px-4 rounded-full bg-white text-[#141413] text-xs font-semibold hover:bg-neutral-100 transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Start COR Questionnaire</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ChevronDown,
  Check,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import type { Profile } from '@/types/database';

interface CorLandingPageProps {
  isPro?: boolean;
  profile?: Partial<Profile> | null;
}

export default function CorLandingPage({
  isPro = false,
  profile,
}: CorLandingPageProps) {
  // Section 05 FAQ Accordion State (open question index)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Six Canonical COR Services (Section 02)
  const services = [
    {
      title: 'Career Profile Review',
      desc: 'Comprehensive portfolio review, artist statement evaluation, and career positioning strategy by experienced art advisors.',
    },
    {
      title: 'Opportunity Discovery',
      desc: 'Hand-curated institutional open calls, prestigious museum residencies, fellowships, and private commissions aligned with your medium.',
    },
    {
      title: 'Application Assistance',
      desc: 'Curatorial guidance to prepare and refine your proposals, grant statements, project descriptions, and submission dossiers.',
    },
    {
      title: 'Direct Job & Exhibition Tracking',
      desc: 'Transparent pipeline management tools to monitor your submissions, institutional milestones, deadlines, and follow-ups in real time.',
    },
    {
      title: '1-on-1 Consultation Calls',
      desc: 'Private strategy sessions with curators and art advisors to evaluate your progress and map your long-term career trajectory.',
    },
    {
      title: 'Verified Artist Badge',
      desc: 'Official curatorial verification that signals rigor to collectors, gallery directors, and curators across the ERAS Studio platform.',
    },
  ];

  // How COR Works 4-Stage Connected Journey (Section 03)
  const stages = [
    {
      num: '01',
      title: 'Build your profile',
      desc: 'Detail your studio practice, medium, exhibition milestones, and aspirational career goals.',
    },
    {
      num: '02',
      title: 'Discover opportunities',
      desc: 'Receive institutional calls, residencies, and grants matched specifically to your background.',
    },
    {
      num: '03',
      title: 'Receive application guidance',
      desc: 'Refine your proposals, artist statements, and dossiers with direct curatorial feedback.',
    },
    {
      num: '04',
      title: 'Track your progress',
      desc: 'Follow each submission through your active pipeline with live milestone updates and advisory calls.',
    },
  ];

  // Essential FAQs (Section 05)
  const faqs = [
    {
      q: 'What is COR and how does it differ from a gallery directory?',
      a: 'COR (Curatorial Opportunity & Representation) is not a static listing site. It is an active artist representation service providing hands-on curatorial evaluation, proposal review, and direct matching with verified museum exhibitions, institutional residencies, and high-value commissions.',
    },
    {
      q: 'Who evaluates my portfolio and application dossiers?',
      a: 'Your portfolio, artist statement, and proposals are reviewed by seasoned curators, exhibition designers, and art advisors with direct institutional experience across leading museums, biennials, and arts foundations.',
    },
    {
      q: 'How do the 1-on-1 consultation calls work?',
      a: 'COR Pro members can schedule dedicated private video consultations with our art advisors to discuss career roadmap strategy, upcoming applications, pricing methodology, and collector engagement.',
    },
    {
      q: 'Can I cancel or pause my COR Pro membership at any time?',
      a: 'Yes. Membership is billed monthly at ₹999 with no lock-in contracts. You can manage, pause, or cancel your subscription at any time from your account settings.',
    },
    {
      q: 'What does the Verified Artist badge provide?',
      a: 'The Verified Artist badge confirms your practice has undergone curatorial vetting, granting your artworks elevated prominence in Discovery searches and collection highlights.',
    },
  ];

  return (
    <div
      className="w-full text-[#141413] selection:bg-[#1345EE] selection:text-white"
      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
    >
      {/* Editorial Top Identity Bar */}
      <div className="flex items-center justify-between py-3 mb-10 sm:mb-14 border-b border-[#E8E8E3]">
        <span className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#6E6E69]">
          COR • Curatorial Opportunity & Representation
        </span>

        {isPro ? (
          <Link
            href="/cor"
            className="text-xs font-medium text-[#1345EE] hover:underline inline-flex items-center gap-1"
          >
            <span>Active Member • COR Hub</span>
            <ArrowRight size={13} />
          </Link>
        ) : (
          <span className="text-xs text-[#6E6E69]">
            Artist Representation
          </span>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 01 — HERO */}
      {/* ========================================================================= */}
      <section className="pb-16 sm:pb-24 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Heading, Supporting Text, Primary CTA */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] leading-[1.05] text-[#141413] tracking-tight"
              style={{
                fontFamily: "'Century Schoolbook', Century, Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 600,
              }}
            >
              Your practice deserves the right opportunities.
            </h1>

            <div className="pt-2">
              <Link
                href={isPro ? '/cor/profile' : '/subscription'}
                style={{
                  position: 'relative',
                  background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                  boxShadow:
                    '0px 7px 22px rgba(35, 77, 255, 0.22), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
                  borderRadius: 9999,
                  outline: '2px #2356FF solid',
                  outlineOffset: '-2px',
                }}
                className="px-8 py-3.5 inline-flex items-center justify-center gap-2.5 text-white text-xs sm:text-sm font-medium hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-md cursor-pointer select-none group"
              >
                <span>{isPro ? 'Review Career Profile' : 'Become a COR Pro Member'}</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column: One Carefully Selected Artwork Image */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#FAF9F5] border border-[#E8E8E3]">
              <Image
                src="/images/blue-lily-artwork.jpg"
                alt="Blue Lily Study"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 02 — COR SERVICES */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 border-t border-[#E8E8E3]">
        <div className="max-w-2xl mb-12 sm:mb-16">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl text-[#141413] leading-[1.08] tracking-tight mb-4"
            style={{
              fontFamily: "'Century Schoolbook', Century, Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 600,
            }}
          >
            What COR makes possible.
          </h2>
          <p className="text-sm sm:text-base text-[#5A5A55] leading-relaxed">
            Curatorial capabilities developed to represent your work, expand your institutional reach, and guide critical career transitions.
          </p>
        </div>

        {/* Two-Column Editorial Service List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-16">
          {/* Left Column (01-03) */}
          <div className="divide-y divide-[#E8E8E3] border-t border-b border-[#E8E8E3] md:border-b-0">
            {services.slice(0, 3).map((service, idx) => (
              <div key={idx} className="py-7 sm:py-8">
                <h3 className="text-lg sm:text-xl font-medium text-[#141413] tracking-tight mb-2">
                  {service.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed font-normal">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Right Column (04-06) */}
          <div className="divide-y divide-[#E8E8E3] border-t border-b border-[#E8E8E3]">
            {services.slice(3, 6).map((service, idx) => (
              <div key={idx} className="py-7 sm:py-8">
                <h3 className="text-lg sm:text-xl font-medium text-[#141413] tracking-tight mb-2">
                  {service.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed font-normal">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 03 — HOW COR WORKS */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 border-t border-[#E8E8E3]">
        <div className="max-w-2xl mb-12 sm:mb-16">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl text-[#141413] leading-[1.08] tracking-tight mb-4"
            style={{
              fontFamily: "'Century Schoolbook', Century, Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 600,
            }}
          >
            A guided path from studio to institution.
          </h2>
          <p className="text-sm sm:text-base text-[#5A5A55] leading-relaxed">
            A transparent four-stage process designed to prepare your practice for institutional recognition.
          </p>
        </div>

        {/* Continuous Editorial Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pt-4 border-t border-[#E8E8E3]">
          {stages.map((st) => (
            <div key={st.num} className="space-y-3 pt-4">
              <span className="block font-mono text-2xl sm:text-3xl font-light text-[#141413]">
                {st.num}
              </span>
              <h3 className="text-base sm:text-lg font-medium text-[#141413] tracking-tight leading-snug">
                {st.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed font-normal">
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 04 — COR PRO MEMBERSHIP */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 border-t border-[#E8E8E3]">
        <div className="max-w-2xl mb-12 sm:mb-16">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl text-[#141413] leading-[1.08] tracking-tight mb-4"
            style={{
              fontFamily: "'Century Schoolbook', Century, Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 600,
            }}
          >
            Invest in representation that advances your practice.
          </h2>
          <p className="text-sm sm:text-base text-[#5A5A55] leading-relaxed">
            One comprehensive membership tier providing unlimited portfolio exhibition, curatorial review, and active institutional opportunity guidance.
          </p>
        </div>

        {/* Restrained Editorial Membership Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pt-8 border-t border-[#E8E8E3] items-start">
          {/* Left Column: Concise Explanation of Membership Value */}
          <div className="lg:col-span-6 space-y-6">
            <h3
              className="text-2xl text-[#141413]"
              style={{
                fontFamily: "'Century Schoolbook', Century, Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 600,
              }}
            >
              Curatorial representation tailored to serious artists.
            </h3>
            <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed font-normal">
              COR functions as your extended studio advisory. While standard creator accounts allow basic public presentation (up to 10 artworks), Pro membership unlocks hands-on curatorial dossier evaluations, direct proposal preparation, and access to verified institutional calls.
            </p>
            <div className="pt-2">
              <Link
                href="/portfolio"
                className="text-xs font-medium text-[#141413] hover:text-[#1345EE] transition-colors inline-flex items-center gap-1.5"
              >
                <span>Return to Portfolio</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Right Column: Pricing, Essential Benefits & Upgrade Action */}
          <div className="lg:col-span-6 space-y-7 lg:pl-6 lg:border-l lg:border-[#E8E8E3]">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[#141413]">
                  ₹999
                </span>
                <span className="text-sm font-normal text-[#6E6E69]">
                  / month
                </span>
              </div>
              <p className="text-xs text-[#6E6E69] mt-1">
                Billed monthly. Cancel or pause anytime.
              </p>
            </div>

            {/* Essential Benefits List */}
            <ul className="space-y-3.5 text-xs sm:text-sm text-[#141413] divide-y divide-[#F0F0EB] pt-2">
              <li className="pt-3.5 flex items-start gap-2.5">
                <Check size={15} className="text-[#1345EE] shrink-0 mt-0.5" />
                <span>Career profile review and curatorial dossier polish</span>
              </li>
              <li className="pt-3.5 flex items-start gap-2.5">
                <Check size={15} className="text-[#1345EE] shrink-0 mt-0.5" />
                <span>Curated institutional opportunities & application guidance</span>
              </li>
              <li className="pt-3.5 flex items-start gap-2.5">
                <Check size={15} className="text-[#1345EE] shrink-0 mt-0.5" />
                <span>1-on-1 strategy consultation calls with curators</span>
              </li>
              <li className="pt-3.5 flex items-start gap-2.5">
                <Check size={15} className="text-[#1345EE] shrink-0 mt-0.5" />
                <span>Real-time submission pipeline and exhibition tracking</span>
              </li>
              <li className="pt-3.5 flex items-start gap-2.5">
                <Check size={15} className="text-[#1345EE] shrink-0 mt-0.5" />
                <span>Official Verified Artist badge across Discovery</span>
              </li>
              <li className="pt-3.5 flex items-start gap-2.5">
                <Check size={15} className="text-[#1345EE] shrink-0 mt-0.5" />
                <span>Unlimited portfolio artwork uploads</span>
              </li>
            </ul>

            {/* Primary Upgrade CTA */}
            <div className="pt-3">
              <Link
                href={isPro ? '/cor/profile' : '/subscription'}
                style={{
                  position: 'relative',
                  background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                  boxShadow:
                    '0px 7px 22px rgba(35, 77, 255, 0.22), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
                  borderRadius: 9999,
                  outline: '2px #2356FF solid',
                  outlineOffset: '-2px',
                }}
                className="w-full sm:w-auto px-8 py-3.5 text-white text-xs sm:text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-md inline-flex items-center justify-center gap-2 group cursor-pointer select-none"
              >
                <span>{isPro ? 'Manage Active Pro Membership' : 'Upgrade to COR Pro — ₹999/mo'}</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 05 — CLOSING CTA AND FAQ */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 border-t border-[#E8E8E3]">
        {/* Clean Open-Layout Closing Statement */}
        <div className="max-w-2xl mx-auto text-center space-y-5 mb-16 sm:mb-20">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl text-[#141413] leading-[1.08] tracking-tight"
            style={{
              fontFamily: "'Century Schoolbook', Century, Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 600,
            }}
          >
            Take the next step in your artistic journey.
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-[#5A5A55] leading-relaxed font-normal">
            Join a dedicated roster of artists receiving thoughtful representation, tailored opportunity discovery, and hands-on curatorial guidance.
          </p>

          <div className="pt-2">
            <Link
              href={isPro ? '/cor' : '/subscription'}
              style={{
                position: 'relative',
                background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                boxShadow:
                  '0px 7px 22px rgba(35, 77, 255, 0.22), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
                borderRadius: 9999,
                outline: '2px #2356FF solid',
                outlineOffset: '-2px',
              }}
              className="px-8 py-3.5 text-white text-xs sm:text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 group cursor-pointer select-none"
            >
              <span>{isPro ? 'Go to COR Hub' : 'Become a COR Pro Member'}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Essential Minimal FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <div className="divide-y divide-[#E8E8E3] border-t border-b border-[#E8E8E3]">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-5 sm:py-6">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left gap-4 cursor-pointer select-none group"
                  >
                    <span className="text-sm sm:text-base font-medium text-[#141413] group-hover:text-[#1345EE] transition-colors leading-snug">
                      {faq.q}
                    </span>
                    <span
                      className={`w-6 h-6 flex items-center justify-center shrink-0 text-[#6E6E69] transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#1345EE]' : ''
                      }`}
                    >
                      <ChevronDown size={15} />
                    </span>
                  </button>

                  {isOpen && (
                    <p className="pt-3 text-xs sm:text-sm text-[#5A5A55] leading-relaxed font-normal animate-in fade-in duration-150">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

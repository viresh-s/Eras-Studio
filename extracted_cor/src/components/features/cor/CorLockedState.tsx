'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Sparkles,
  ArrowRight,
  UserCheck,
  Search,
  Layers,
  Briefcase,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { activateProSubscriptionAction } from '@/actions/corActions';

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
  const router = useRouter();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleActivatePro = async () => {
    setIsUpgrading(true);
    try {
      await activateProSubscriptionAction();
      setIsUpgradeModalOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error('Upgrade error:', err);
      alert(err.message || 'Upgrade failed');
    } finally {
      setIsUpgrading(false);
    }
  };

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
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#141413] text-white text-sm font-medium hover:bg-[#2A2A28] active:bg-black transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Upgrade to PRO</span>
              <ArrowRight size={16} />
            </button>
            <Link
              href="/portfolio"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-[#E8E8E3] text-xs sm:text-sm font-medium text-[#6E6E69] hover:bg-neutral-50 transition-colors inline-flex items-center justify-center"
            >
              Back to Portfolio
            </Link>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Activate ErasStudio® Pro"
        size="md"
      >
        <div className="space-y-5 text-center py-2">
          <div className="w-14 h-14 rounded-full bg-[#141413] text-white flex items-center justify-center mx-auto shadow-md">
            <Sparkles size={24} className="text-[#FBBF24]" />
          </div>

          <div>
            <h3 className="font-serif text-2xl font-semibold text-[#141413]">
              Unlock COR Pro Membership
            </h3>
            <p className="text-xs sm:text-sm text-[#6E6E69] mt-2 max-w-sm mx-auto leading-relaxed">
              Join curated institutional calls, personal career advisory sessions, and comprehensive application pipeline tracking.
            </p>
          </div>

          <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-2xl p-4 text-left space-y-2.5 text-xs text-[#5A5A55]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={15} className="text-[#28633B] flex-shrink-0" />
              <span>Full COR 8-step career questionnaire & profile review</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={15} className="text-[#28633B] flex-shrink-0" />
              <span>Direct 1-on-1 career consultation bookings with team</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={15} className="text-[#28633B] flex-shrink-0" />
              <span>Application tracking across all 8 pipeline stages</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={15} className="text-[#28633B] flex-shrink-0" />
              <span>Rule-based matching tailored to your practice & goals</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="button"
              size="md"
              isLoading={isUpgrading}
              onClick={handleActivatePro}
              className="w-full px-6 py-3.5 rounded-full bg-[#141413] text-white text-xs sm:text-sm font-medium hover:bg-[#2A2A28] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Sparkles size={14} className="text-[#FBBF24]" />
              <span>Activate Pro Tier & Unlock COR</span>
            </Button>
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(false)}
              className="text-xs text-[#8A8A85] hover:text-[#141413] py-1 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

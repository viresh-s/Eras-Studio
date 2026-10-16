'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Crown, Zap, Infinity, BarChart3, Star, ArrowRight } from 'lucide-react';
import type { FreemiumStatus } from '@/lib/freemium/check';

interface UpgradePromptProps {
  userId: string;
  freemiumStatus: FreemiumStatus;
}

export default function UpgradePrompt({ userId: _userId, freemiumStatus }: UpgradePromptProps) {
  return (
    <div>
      <div className="text-center pb-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FAF5EC] border border-[#ECDDBB] flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Crown size={28} className="text-[#865E16]" />
        </div>

        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Upgrade to Pro</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto text-xs sm:text-sm leading-relaxed">{freemiumStatus.reason}</p>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <Infinity size={20} className="flex-shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Higher Upload Allowance</p>
              <p className="text-xs text-gray-500">Expand your artistic catalogue</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <Zap size={20} className="flex-shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 text-sm">COR Career Hub</p>
              <p className="text-xs text-gray-500">Curated opportunities & advisory</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <BarChart3 size={20} className="flex-shrink-0 text-pink-600 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Application Tracking</p>
              <p className="text-xs text-gray-500">Track gallery & grant submissions</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <Star size={20} className="flex-shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Consultation Access</p>
              <p className="text-xs text-gray-500">1-on-1 sessions with curatorial team</p>
            </div>
          </div>
        </div>

        <Link href="/subscription" className="inline-block">
          <Button size="lg" className="px-8 py-3.5 bg-[#141413] text-white hover:bg-[#2A2A28] rounded-full inline-flex items-center gap-2 group shadow-sm">
            <Crown size={18} className="text-[#FBBF24]" />
            <span>View Subscription Plans & Upgrade</span>
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

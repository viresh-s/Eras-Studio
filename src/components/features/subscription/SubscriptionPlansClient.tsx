'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Shield, ArrowRight, Loader2, X, CreditCard } from 'lucide-react';
import { upgradeUserPlanAction, PlanTier } from '@/actions/subscriptionActions';

interface SubscriptionPlansClientProps {
  initialPlan: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

export function SubscriptionPlansClient({
  initialPlan,
  userName,
  userEmail,
}: SubscriptionPlansClientProps) {
  const router = useRouter();

  // Normalize current plan: 'free' | 'lite' | 'pro'
  const normalizePlan = (rawPlan: string | null | undefined): PlanTier => {
    if (!rawPlan) return 'free';
    const p = rawPlan.toLowerCase().trim();
    if (p === 'lite' || p === 'light') return 'lite';
    if (p === 'pro' || p === 'elite') return 'pro';
    return 'free';
  };

  const [currentPlan, setCurrentPlan] = useState<PlanTier>(normalizePlan(initialPlan));
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<PlanTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const isPro = currentPlan === 'pro';
  const isLite = currentPlan === 'lite';
  const isFree = currentPlan === 'free';

  // Handle plan upgrade confirmation
  const handleConfirmUpgrade = async (targetPlan: PlanTier) => {
    setIsLoading(true);
    try {
      const res = await upgradeUserPlanAction(targetPlan);
      if (res.success && res.plan) {
        setCurrentPlan(res.plan);
        setSelectedPlanForModal(null);
        setSuccessToast(
          targetPlan === 'pro'
            ? 'Welcome to Pro! You now have full access to COR and unlimited capabilities.'
            : targetPlan === 'lite'
            ? 'Upgraded to Lite! Your portfolio capacity has expanded to 50 artworks.'
            : 'Plan updated to Free.'
        );
        router.refresh();
      } else {
        alert(res.error || 'Failed to update subscription.');
      }
    } catch (err: any) {
      console.error('Upgrade error:', err);
      alert(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-[#141413] text-[#FAF5EC] p-4 rounded-2xl shadow-2xl border border-white/10 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-5 h-5 text-[#E8C382] shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-sm text-white">Subscription Updated</p>
            <p className="text-[#A1A19A] mt-0.5">{successToast}</p>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-[#A1A19A] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header matching screenshot */}
      <div className="max-w-2xl mb-12 sm:mb-16">
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#8A8A85] mb-3">
          ROOM TO GROW
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#141413] tracking-tight mb-3">
          A plan for your practice.
        </h1>
        <p className="text-sm sm:text-base text-[#6E6E69] leading-relaxed">
          Start with your art. Add more possibilities when you&apos;re ready.
        </p>
      </div>

      {/* Current Plan Status Pill for user clarity */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4 p-4 rounded-2xl bg-white border border-[#E8E8E3] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#28633B] animate-pulse" />
          <p className="text-xs text-[#6E6E69]">
            Active Subscription:{' '}
            <span className="font-semibold text-[#141413] uppercase tracking-wide">
              {currentPlan} Tier
            </span>
          </p>
        </div>
        <p className="text-xs text-[#8A8A85]">
          Razorpay billing gateway integration ready
        </p>
      </div>

      {/* 3-Column Pricing Grid matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {/* CARD 1: Free Plan */}
        <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-[#E8E8E3] shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-[#D5D5CF]">
          <div>
            <h2 className="font-serif text-3xl font-bold text-[#141413] mb-4">Free</h2>

            <div className="mb-4">
              <span className="text-4xl sm:text-5xl font-sans font-bold text-[#141413] tracking-tight">
                ₹0
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#6E6E69] mb-8 pb-6 border-b border-[#F0F0EB] min-h-[44px]">
              A simple space to begin.
            </p>

            {/* Features */}
            <ul className="space-y-4 mb-8">
              {[
                'Basic public portfolio',
                '3 artworks',
                'Discovery & saved works',
                'Interest requests',
                'Chat after acceptance',
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-xs sm:text-sm text-[#2C2C28]">
                  <Check className="w-4 h-4 text-[#141413] shrink-0 mt-0.5 stroke-[2.2]" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Button Slot for Free */}
          <div className="pt-4">
            {isFree ? (
              <button
                disabled
                className="w-full py-3.5 px-6 rounded-full bg-[#71716D] text-white font-medium text-xs sm:text-sm cursor-default shadow-xs select-none"
              >
                Current Plan
              </button>
            ) : isLite ? (
              <button
                onClick={() => setSelectedPlanForModal('free')}
                className="w-full py-3 px-6 rounded-full border border-[#E8E8E3] text-[#6E6E69] hover:text-[#141413] hover:border-[#141413] font-medium text-xs transition-colors"
              >
                Downgrade to Free
              </button>
            ) : (
              /* When in Pro, upgrade button disappears completely */
              <div className="py-3 text-center text-xs text-[#8A8A85] font-medium">
                Included in Pro
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: Lite Plan */}
        <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-[#E8E8E3] shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-[#D5D5CF]">
          <div>
            <h2 className="font-serif text-3xl font-bold text-[#141413] mb-4">Lite</h2>

            <div className="mb-4 flex items-baseline gap-1.5">
              <span className="text-4xl sm:text-5xl font-sans font-bold text-[#141413] tracking-tight">
                ₹499
              </span>
              <span className="text-xs sm:text-sm text-[#6E6E69] font-medium">/ month</span>
            </div>

            <p className="text-xs sm:text-sm text-[#6E6E69] mb-8 pb-6 border-b border-[#F0F0EB] min-h-[44px]">
              Give your portfolio room to grow.
            </p>

            {/* Features */}
            <ul className="space-y-4 mb-8">
              {[
                'Everything in Free',
                '50 artworks (prototype limit)',
                'Portfolio management',
                'Curated collections',
                'More room to experiment',
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-xs sm:text-sm text-[#2C2C28]">
                  <Check className="w-4 h-4 text-[#141413] shrink-0 mt-0.5 stroke-[2.2]" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Button Slot for Lite */}
          <div className="pt-4">
            {isLite ? (
              <button
                disabled
                className="w-full py-3.5 px-6 rounded-full bg-[#71716D] text-white font-medium text-xs sm:text-sm cursor-default shadow-xs select-none"
              >
                Current Plan
              </button>
            ) : isFree ? (
              /* When user is in Free, Upgrade button to Lite IS ACTIVE */
              <button
                onClick={() => setSelectedPlanForModal('lite')}
                className="w-full py-3.5 px-6 rounded-full bg-[#141413] text-white hover:bg-black font-medium text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
              >
                Upgrade to Lite
              </button>
            ) : (
              /* When user is in Pro, upgrade button disappears completely */
              <div className="py-3 text-center text-xs text-[#8A8A85] font-medium">
                Included in Pro
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: Pro Plan (Dark Luxury Card matching screenshot) */}
        <div className="bg-[#181818] text-white rounded-[32px] p-8 sm:p-10 border border-[#2A2A2A] shadow-xl flex flex-col justify-between relative transition-all duration-300 hover:shadow-2xl">
          <div>
            {/* Top Right Pill Badge */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-3xl font-bold text-white">Pro</h2>
              <span className="px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white text-[11px] font-medium tracking-wide">
                Art + opportunity
              </span>
            </div>

            <div className="mb-4 flex items-baseline gap-1.5">
              <span className="text-4xl sm:text-5xl font-sans font-bold text-white tracking-tight">
                ₹999
              </span>
              <span className="text-xs sm:text-sm text-[#A1A19A] font-medium">/ month</span>
            </div>

            <p className="text-xs sm:text-sm text-[#A1A19A] mb-8 pb-6 border-b border-white/10 min-h-[44px]">
              Your art. Your next chapter.
            </p>

            {/* Features */}
            <ul className="space-y-4 mb-8">
              {[
                'Everything in Lite',
                'High artwork allowance',
                'COR career profile',
                'Managed career assistance',
                'Application tracker & consultations',
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-xs sm:text-sm text-[#EDEDEB]">
                  <Check className="w-4 h-4 text-white shrink-0 mt-0.5 stroke-[2.2]" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Button Slot for Pro */}
          <div className="pt-4">
            {isPro ? (
              /* User is on Pro -> Upgrade button disappears completely! Displays current plan badge */
              <div className="w-full py-3.5 px-6 rounded-full bg-white/10 border border-white/20 text-white font-medium text-xs sm:text-sm text-center flex items-center justify-center gap-2 select-none">
                <Check className="w-4 h-4 text-[#A3E635]" />
                <span>Current Plan (Active)</span>
              </div>
            ) : (
              /* User is in Free or Lite -> Upgrade button is ACTIVE */
              <button
                onClick={() => setSelectedPlanForModal('pro')}
                className="w-full py-3.5 px-6 rounded-full bg-white text-[#141413] hover:bg-[#F5F5F0] font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>Upgrade to Pro</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Testing Switcher (Allows instant verification of Free, Lite, and Pro states) */}
      <div className="mt-16 p-6 rounded-2xl bg-[#FAF5EC] border border-[#ECDDBB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#865E16]">
            Plan State Simulator (Testing Mode)
          </p>
          <p className="text-xs text-[#6E6E69]">
            Test how the page behaves when the user is in <strong>Free</strong>, <strong>Lite</strong>, or <strong>Pro</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleConfirmUpgrade('free')}
            disabled={isLoading || isFree}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              isFree
                ? 'bg-[#141413] text-white border-[#141413]'
                : 'bg-white text-[#141413] border-[#E8E8E3] hover:bg-[#F5F5F0]'
            }`}
          >
            Free
          </button>
          <button
            onClick={() => handleConfirmUpgrade('lite')}
            disabled={isLoading || isLite}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              isLite
                ? 'bg-[#141413] text-white border-[#141413]'
                : 'bg-white text-[#141413] border-[#E8E8E3] hover:bg-[#F5F5F0]'
            }`}
          >
            Lite
          </button>
          <button
            onClick={() => handleConfirmUpgrade('pro')}
            disabled={isLoading || isPro}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              isPro
                ? 'bg-[#141413] text-white border-[#141413]'
                : 'bg-white text-[#141413] border-[#E8E8E3] hover:bg-[#F5F5F0]'
            }`}
          >
            Pro
          </button>
        </div>
      </div>

      {/* Subscription Confirmation Modal */}
      {selectedPlanForModal && (
        <div className="fixed inset-0 z-50 bg-[#141413]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E8E8E3] shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-[#865E16]">
                  Confirm Subscription
                </p>
                <h3 className="font-serif text-2xl font-bold text-[#141413] mt-0.5">
                  Upgrade to {selectedPlanForModal === 'pro' ? 'Pro' : selectedPlanForModal === 'lite' ? 'Lite' : 'Free'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlanForModal(null)}
                className="p-1.5 rounded-full text-[#8A8A85] hover:text-[#141413] hover:bg-[#F5F5F0] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF5EC]/70 border border-[#E8E8E3] space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6E6E69]">Selected Plan</span>
                <span className="font-bold text-[#141413] capitalize">{selectedPlanForModal}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6E6E69]">Monthly Price</span>
                <span className="font-bold text-[#141413]">
                  {selectedPlanForModal === 'pro'
                    ? '₹999 / month'
                    : selectedPlanForModal === 'lite'
                    ? '₹499 / month'
                    : '₹0'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-[#8A8A85] pt-2 border-t border-[#E8E8E3]">
                <span>Subscriber:</span>
                <span className="font-medium text-[#141413]">{userEmail || 'Active User'}</span>
              </div>
            </div>

            {/* Razorpay Connection Notice */}
            <div className="p-3.5 rounded-xl bg-[#F4F4ED] border border-[#E5E5DF] text-xs text-[#52524E] space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-[#141413]">
                <CreditCard className="w-4 h-4 text-[#865E16]" />
                Razorpay Payment Gateway
              </div>
              <p className="text-[11px] leading-relaxed">
                Razorpay payment processing will be connected here. In this preview, clicking confirm will instantly activate your {selectedPlanForModal.toUpperCase()} subscription.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPlanForModal(null)}
                className="px-5 py-2.5 rounded-full border border-[#E8E8E3] text-[#141413] text-xs font-semibold hover:bg-[#F5F5F0] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleConfirmUpgrade(selectedPlanForModal)}
                className="px-6 py-2.5 rounded-full bg-[#141413] text-white hover:bg-black text-xs font-semibold transition-all shadow-sm flex items-center gap-2"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Activate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

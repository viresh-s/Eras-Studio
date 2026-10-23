'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, X, CreditCard, Loader2, ArrowRight } from 'lucide-react';
import { upgradeUserPlanAction, PlanTier } from '@/actions/subscriptionActions';

interface SubscriptionPlansClientProps {
  initialPlan: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

// Dynamically load Razorpay standard checkout SDK
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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

  // Check if Razorpay public key is configured in environment
  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  // Handle plan upgrade confirmation and database sync
  const handleConfirmUpgrade = async (targetPlan: PlanTier, paymentId?: string) => {
    setIsLoading(true);
    try {
      const res = await upgradeUserPlanAction(targetPlan, paymentId);
      if (res.success && res.plan) {
        setCurrentPlan(res.plan);
        setSelectedPlanForModal(null);
        setSuccessToast(
          targetPlan === 'pro'
            ? 'Welcome to Pro! You now have full access to COR career tools and unlimited uploads.'
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

  // Initiate Payment / Upgrade Flow
  const handleInitiatePayment = async (targetPlan: PlanTier) => {
    if (targetPlan === 'free') {
      await handleConfirmUpgrade('free');
      return;
    }

    // If Razorpay Key is provided, launch official Razorpay standard checkout modal
    if (razorpayKey && typeof window !== 'undefined') {
      setIsLoading(true);
      try {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          alert('Could not load Razorpay checkout SDK. Please verify internet connection.');
          setIsLoading(false);
          return;
        }

        const amountInPaise = targetPlan === 'pro' ? 99900 : 49900;
        const options = {
          key: razorpayKey,
          amount: amountInPaise,
          currency: 'INR',
          name: 'ERAS Studio',
          description: `${targetPlan.toUpperCase()} Membership Subscription`,
          image: '/favicon.ico',
          prefill: {
            name: userName || '',
            email: userEmail || '',
          },
          theme: {
            color: '#141413',
          },
          handler: async function (response: any) {
            await handleConfirmUpgrade(targetPlan, response.razorpay_payment_id);
          },
          modal: {
            ondismiss: function () {
              setIsLoading(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          console.error('Razorpay payment failed:', response.error);
          alert(`Payment failed: ${response.error.description || 'Transaction declined'}`);
          setIsLoading(false);
        });
        rzp.open();
      } catch (err: any) {
        console.error('Razorpay execution error:', err);
        setIsLoading(false);
        // Fallback direct activation
        await handleConfirmUpgrade(targetPlan);
      }
    } else {
      // Razorpay key not added yet: direct instant activation for test mode
      await handleConfirmUpgrade(targetPlan);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-[#141413] text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-sm text-white">Subscription Updated</p>
            <p className="text-[#A1A19A] mt-0.5">{successToast}</p>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-[#A1A19A] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
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

      {/* Active Subscription Status Banner */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4 p-4 rounded-2xl bg-white border border-[#E8E8E3] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
          <p className="text-xs text-[#6E6E69]">
            Active Subscription:{' '}
            <span className="font-semibold text-[#141413] uppercase tracking-wide">
              {currentPlan} Tier
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F5F5F5] border border-[#E5E5E5] text-[#141413]">
            <CreditCard size={13} className="text-[#141413]" />
            {razorpayKey ? 'Razorpay Live Checkout Active' : 'Razorpay Ready (Test Mode Active)'}
          </span>
        </div>
      </div>

      {/* 3-Column Pricing Grid */}
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
                className="w-full py-3 px-6 rounded-full border border-[#E8E8E3] text-[#6E6E69] hover:text-[#141413] hover:border-[#141413] font-medium text-xs transition-colors cursor-pointer"
              >
                Downgrade to Free
              </button>
            ) : (
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
                '50 artworks allowance',
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
              <button
                onClick={() => setSelectedPlanForModal('lite')}
                className="w-full py-3.5 px-6 rounded-full bg-[#141413] text-white hover:bg-black font-medium text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99] cursor-pointer"
              >
                Upgrade to Lite
              </button>
            ) : (
              <div className="py-3 text-center text-xs text-[#8A8A85] font-medium">
                Included in Pro
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: Pro Plan (Dark Luxury Card) */}
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
                'Unlimited artwork allowance',
                'COR career profile & verified badge',
                'Managed career assistance & curation',
                'Application tracker & curatorial consultations',
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
              <div className="w-full py-3.5 px-6 rounded-full bg-white/10 border border-white/20 text-white font-medium text-xs sm:text-sm text-center flex items-center justify-center gap-2 select-none">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Current Plan (Active)</span>
              </div>
            ) : (
              <button
                onClick={() => setSelectedPlanForModal('pro')}
                className="w-full py-3.5 px-6 rounded-full bg-white text-[#141413] hover:bg-neutral-100 font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Upgrade to Pro</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Confirmation & Payment Modal */}
      {selectedPlanForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-200 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                  Confirm Subscription
                </p>
                <h3 className="font-serif text-2xl font-bold text-[#141413] mt-0.5">
                  Upgrade to {selectedPlanForModal === 'pro' ? 'Pro' : selectedPlanForModal === 'lite' ? 'Lite' : 'Free'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlanForModal(null)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plan Details Card */}
            <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E8E8E3] space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6E6E69]">Selected Plan</span>
                <span className="font-bold text-[#141413] capitalize">{selectedPlanForModal}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6E6E69]">Billing Rate</span>
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

            {/* Razorpay Gateway Status */}
            <div className="p-4 rounded-xl bg-white border border-[#E5E5DF] text-xs text-[#52524E] space-y-1.5 shadow-2xs">
              <div className="font-semibold flex items-center gap-1.5 text-[#141413]">
                <CreditCard className="w-4 h-4 text-[#141413]" />
                <span>Razorpay Standard Checkout</span>
              </div>
              {razorpayKey ? (
                <p className="text-[11px] leading-relaxed text-gray-600">
                  Razorpay live gateway is active. Clicking proceed will open the secure checkout modal to pay with UPI, Net Banking, or Credit/Debit Card.
                </p>
              ) : (
                <p className="text-[11px] leading-relaxed text-gray-600">
                  Razorpay integration is fully wired. Once you add <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px] font-mono text-gray-800">NEXT_PUBLIC_RAZORPAY_KEY_ID</code> to your environment, live checkout will open. Currently in test activation mode.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPlanForModal(null)}
                className="px-5 py-2.5 rounded-full border border-gray-300 text-[#141413] text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleInitiatePayment(selectedPlanForModal)}
                className="px-6 py-2.5 rounded-full bg-[#141413] text-white hover:bg-black text-xs font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {selectedPlanForModal === 'free'
                    ? 'Confirm Downgrade'
                    : razorpayKey
                    ? `Pay ₹${selectedPlanForModal === 'pro' ? '999' : '499'} via Razorpay`
                    : 'Confirm & Activate'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

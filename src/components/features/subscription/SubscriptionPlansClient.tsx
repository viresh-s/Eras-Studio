'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, X, CreditCard, Loader2, ArrowRight, AlertCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import { upgradeUserPlanAction, createRazorpayOrderAction, PlanTier, type RazorpayPaymentProof } from '@/actions/subscriptionActions';

interface SubscriptionPlansClientProps {
  initialPlan: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

// Dynamically load Razorpay standard checkout SDK
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);
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
  const searchParams = useSearchParams();

  // Check if redirected from hitting limits
  const reasonParam = searchParams?.get('reason') || searchParams?.get('from');
  const [dismissReasonNotice, setDismissReasonNotice] = useState(false);

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
  const handleConfirmUpgrade = async (targetPlan: PlanTier, proof?: RazorpayPaymentProof | string) => {
    setIsLoading(true);
    try {
      const res = await upgradeUserPlanAction(targetPlan, proof);
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
    } catch (err: unknown) {
      console.error('Upgrade error:', err);
      alert(err instanceof Error ? err.message : 'An unexpected error occurred.');
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

        // Attempt to create authorized server-side order
        let serverOrderId: string | undefined;
        try {
          const orderRes = await createRazorpayOrderAction(targetPlan as 'lite' | 'pro');
          if (orderRes.success && orderRes.orderId) {
            serverOrderId = orderRes.orderId;
          }
        } catch (orderErr) {
          console.warn('[Razorpay] Server order init note:', orderErr);
        }

        const amountInPaise = targetPlan === 'pro' ? 99900 : 49900;
        const options: Record<string, unknown> = {
          key: razorpayKey,
          amount: amountInPaise,
          currency: 'INR',
          order_id: serverOrderId,
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
          handler: async function (response: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string }) {
            await handleConfirmUpgrade(targetPlan, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: function () {
              setIsLoading(false);
            },
          },
        };

        const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: unknown) => { on: (event: string, handler: (resp: { error?: { description?: string } }) => void) => void; open: () => void } }).Razorpay;
        const rzp = new RazorpayConstructor(options);
        rzp.on('payment.failed', function (response: { error?: { description?: string } }) {
          console.error('Razorpay payment failed:', response.error);
          alert(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
          setIsLoading(false);
        });
        rzp.open();
      } catch (err: unknown) {
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
    <div
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14 select-none"
      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
    >
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-[#141413] text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
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

      {/* Limit Reached Contextual Alert Banner */}
      {reasonParam && !dismissReasonNotice && (
        <div className="mb-8 bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 text-amber-900 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <span>
              {reasonParam.includes('cor')
                ? 'COR Hub and institutional career representation requires an active Pro subscription.'
                : "You've reached your free 3-artwork gallery limit. Upgrade to Lite for 50 artworks or Pro for unlimited works and curatorial representation."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDismissReasonNotice(true)}
            className="text-amber-600 hover:text-amber-900 p-1 rounded-md hover:bg-amber-100/70 transition-colors shrink-0 cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Editorial Page Header */}
      <div className="border-b border-[#E8E8E3] pb-6 mb-8">
        <div className="flex items-center gap-2 text-xs font-medium text-[#8A8A85] mb-2 font-sans">
          <Link href="/portfolio" className="hover:text-[#141413] transition-colors flex items-center gap-1.5">
            <span>Portfolio</span>
          </Link>
          <ChevronRight size={13} className="text-[#8A8A85]" />
          <span className="text-[#141413]">Subscription Plans</span>
        </div>
        <div>
          <h1
            className="century-heading text-3xl sm:text-4xl text-[#141413] tracking-tight leading-tight"
            style={{
              fontFamily: '"Century", \'Century Schoolbook\', Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 500,
            }}
          >
            A plan for your practice
          </h1>
          <p
            className="text-xs sm:text-sm text-[#6E6E69] font-normal mt-2 max-w-2xl leading-relaxed"
            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
          >
            Start with your art. Add curatorial guidance, portfolio collections, and institutional opportunities when you are ready.
          </p>
        </div>
      </div>

      {/* Active Subscription Status Banner (Capsule style) */}
      <div className="mb-10 flex items-center justify-between flex-wrap gap-3 px-5 py-3 rounded-full bg-white border border-[#EBEBE6] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs text-gray-600 font-normal">
            Active Tier:{' '}
            <span className="font-medium text-[#141413] uppercase tracking-wide">
              {currentPlan} Plan
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-normal bg-[#F5F5F0] border border-[#E5E5DF] text-gray-700">
            <CreditCard size={12} className="text-gray-700" />
            {razorpayKey ? 'Razorpay Live Checkout Active' : 'Razorpay Ready (Test Mode)'}
          </span>
        </div>
      </div>

      {/* 3-Column Pricing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {/* CARD 1: Free Plan */}
        <div className="bg-white rounded-3xl p-8 sm:p-9 border border-[#EBEBE6] shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-gray-300">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2
                className="century-heading text-2xl text-[#141413]"
                style={{
                  fontFamily: '"Century", \'Century Schoolbook\', Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 500,
                }}
              >
                Free
              </h2>
              <span className="text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-normal">
                Starter
              </span>
            </div>

            <div className="mb-6">
              <span className="text-4xl sm:text-5xl font-normal text-[#141413] tracking-tight">
                ₹0
              </span>
              <span className="text-xs text-gray-500 ml-1.5 font-normal">/ forever</span>
            </div>

            {/* Features */}
            <ul className="space-y-3.5 mb-8">
              {[
                'Basic public artist profile',
                'Up to 3 published artworks',
                'Discovery & artwork bookmarking',
                'Receive private collector inquiries',
                'Chat channel upon accepted inquiry',
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-xs text-gray-600 font-normal">
                  <Check className="w-4 h-4 text-gray-800 shrink-0 mt-0.5 stroke-[2]" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Button Slot for Free */}
          <div className="pt-4 border-t border-gray-100">
            {isFree ? (
              <button
                disabled
                className="w-full h-11 px-6 rounded-full bg-[#F4F4F0] text-gray-500 font-normal text-xs cursor-default select-none border border-gray-200"
              >
                Current Active Plan
              </button>
            ) : (
              <button
                onClick={() => setSelectedPlanForModal('free')}
                className="w-full h-11 px-6 rounded-full border border-[#EBEBE6] text-gray-600 hover:text-black hover:border-black font-normal text-xs transition-colors cursor-pointer"
              >
                Downgrade to Free
              </button>
            )}
          </div>
        </div>

        {/* CARD 2: Lite Plan */}
        <div className="bg-white rounded-3xl p-8 sm:p-9 border border-[#EBEBE6] shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-gray-300">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2
                className="century-heading text-2xl text-[#141413]"
                style={{
                  fontFamily: '"Century", \'Century Schoolbook\', Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 500,
                }}
              >
                Lite
              </h2>
              <span className="text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1345EE] font-medium">
                Extended Studio
              </span>
            </div>

            <div className="mb-6 flex items-baseline gap-1.5">
              <span className="text-4xl sm:text-5xl font-normal text-[#141413] tracking-tight">
                ₹499
              </span>
              <span className="text-xs text-gray-500 font-normal">/ month</span>
            </div>

            {/* Features */}
            <ul className="space-y-3.5 mb-8">
              {[
                'Everything in Free tier',
                '50 published artworks allowance',
                'Thematic series & solo collections',
                'Priority curation in Discovery',
                'Enhanced artwork dossier and CV upload',
                'Direct collector acquisitions',
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-xs text-gray-600 font-normal">
                  <Check className="w-4 h-4 text-[#1345EE] shrink-0 mt-0.5 stroke-[2]" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Button Slot for Lite */}
          <div className="pt-4 border-t border-gray-100">
            {isLite ? (
              <button
                disabled
                className="w-full h-11 px-6 rounded-full bg-[#F4F4F0] text-gray-500 font-normal text-xs cursor-default select-none border border-gray-200"
              >
                Current Active Plan
              </button>
            ) : isPro ? (
              <button
                onClick={() => setSelectedPlanForModal('lite')}
                className="w-full h-11 px-6 rounded-full border border-[#EBEBE6] text-gray-600 hover:text-black hover:border-black font-normal text-xs transition-colors cursor-pointer"
              >
                Switch to Lite
              </button>
            ) : (
              <button
                onClick={() => setSelectedPlanForModal('lite')}
                className="w-full h-11 px-6 rounded-full bg-[#181A1F] text-white hover:bg-black font-normal text-xs transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              >
                Upgrade to Lite
              </button>
            )}
          </div>
        </div>

        {/* CARD 3: Pro Plan (Luxury Signature Plan) */}
        <div
          style={{
            background:
              'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%) border-box',
            border: '2px solid transparent',
            boxShadow: '0px 10px 30px rgba(35, 77, 255, 0.1), 0px 1px 4px rgba(35, 77, 255, 0.06)',
          }}
          className="bg-white rounded-3xl p-8 sm:p-9 flex flex-col justify-between relative transition-all duration-300 hover:shadow-xl"
        >
          <div>
            {/* Top Pill: Recommended */}
            <div className="flex items-center justify-between mb-3">
              <h2
                className="century-heading text-2xl text-[#141413]"
                style={{
                  fontFamily: '"Century", \'Century Schoolbook\', Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 500,
                }}
              >
                Pro
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1345EE] font-semibold border border-blue-200/60 shadow-2xs">
                <ShieldCheck size={12} className="text-[#1345EE]" />
                <span>Recommended</span>
              </span>
            </div>

            <div className="mb-6 flex items-baseline gap-1.5">
              <span
                style={{
                  background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
                className="text-4xl sm:text-5xl font-semibold tracking-tight"
              >
                ₹999
              </span>
              <span className="text-xs text-gray-500 font-normal">/ month</span>
            </div>

            {/* Features */}
            <ul className="space-y-3.5 mb-8">
              {[
                'Everything in Lite tier',
                'Unlimited artwork publishing',
                'Full COR Career Hub membership',
                'Curatorial portfolio review & positioning',
                'Institutional grants & residency tracking',
                '1-on-1 strategic consultation calls',
                'Official Verified Artist badge',
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-xs text-gray-700 font-normal">
                  <Check className="w-4 h-4 text-[#1345EE] shrink-0 mt-0.5 stroke-[2.2]" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Button Slot for Pro */}
          <div className="pt-4 border-t border-gray-100">
            {isPro ? (
              <div className="w-full h-11 px-6 rounded-full bg-blue-50 border border-blue-200 text-[#1345EE] font-medium text-xs text-center flex items-center justify-center gap-2 select-none">
                <Check className="w-4 h-4 text-[#1345EE]" />
                <span>Current Plan (Active)</span>
              </div>
            ) : (
              <button
                onClick={() => setSelectedPlanForModal('pro')}
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
                className="w-full h-11 px-6 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98] select-none shadow-md group"
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
                <span className="text-white text-xs sm:text-sm font-normal relative z-10 flex items-center gap-1.5">
                  <span>Upgrade to Pro</span>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Confirmation & Payment Modal */}
      {selectedPlanForModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPlanForModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#EBEBE6] shadow-2xl space-y-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-normal text-gray-500">
                  Confirm Subscription
                </p>
                <h3
                  className="century-heading text-2xl text-[#141413] mt-1"
                  style={{
                    fontFamily: '"Century", \'Century Schoolbook\', Georgia, serif',
                    fontStyle: 'italic',
                    fontWeight: 500,
                  }}
                >
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
            <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#EBEBE6] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-normal">Selected Tier</span>
                <span className="font-semibold text-[#141413] uppercase tracking-wide">{selectedPlanForModal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-normal">Billing Rate</span>
                <span className="font-semibold text-[#141413]">
                  {selectedPlanForModal === 'pro'
                    ? '₹999 / month'
                    : selectedPlanForModal === 'lite'
                    ? '₹499 / month'
                    : '₹0 / month'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#EBEBE6] text-gray-500 font-normal">
                <span>Account:</span>
                <span className="font-medium text-[#141413]">{userEmail || 'Active Member'}</span>
              </div>
            </div>

            {/* Razorpay Gateway Status */}
            <div className="p-4 rounded-2xl bg-white border border-[#EBEBE6] text-xs text-gray-600 space-y-1.5 shadow-2xs">
              <div className="font-medium flex items-center gap-1.5 text-[#141413]">
                <CreditCard className="w-4 h-4 text-[#1345EE]" />
                <span>Secure Checkout Gateway</span>
              </div>
              {razorpayKey ? (
                <p className="text-[11px] leading-relaxed text-gray-500">
                  Razorpay live gateway is active. Clicking proceed will open the checkout window to pay with UPI, Net Banking, or Credit/Debit Card.
                </p>
              ) : (
                <p className="text-[11px] leading-relaxed text-gray-500">
                  Razorpay integration is fully wired. Currently in test activation mode.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPlanForModal(null)}
                className="h-10 px-5 rounded-full border border-gray-300 text-gray-700 text-xs font-normal hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleInitiatePayment(selectedPlanForModal)}
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
                className="h-10 px-6 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98] select-none text-white text-xs font-normal shadow-md"
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
                <span className="relative z-10 flex items-center gap-1.5">
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {selectedPlanForModal === 'free'
                      ? 'Confirm Free Tier'
                      : `Proceed to Pay ${selectedPlanForModal === 'pro' ? '₹999' : '₹499'}`}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  featureName?: string;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  title = "You've reached your 3-artwork limit",
  description = 'Your free tier allows publishing up to 3 pieces. Upgrade to Lite or Pro to expand your gallery, curate unlimited series, and access COR career representation.',
  featureName,
}: UpgradeModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#EBEBE6] shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative select-none"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Top Badge */}
        <div className="flex items-center gap-2">
          <span
            style={{
              background:
                'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%) border-box',
              border: '1.5px solid transparent',
            }}
            className="h-7 px-3 rounded-full inline-flex items-center gap-1.5 text-[11px] font-medium text-[#1345EE] shadow-2xs"
          >
            <Sparkles size={12} className="text-[#1345EE]" />
            <span>{featureName ? `${featureName} • Upgrade` : 'Gallery Limit Reached'}</span>
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h2
            className="text-2xl sm:text-3xl font-serif italic font-semibold text-[#141413] tracking-tight leading-snug"
            style={{
              fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
              fontStyle: 'italic',
            }}
          >
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-normal mt-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Plan Comparison Highlights */}
        <div className="space-y-2.5 pt-1">
          {/* Free (Current) */}
          <div className="p-3 rounded-2xl bg-[#F9F9F7] border border-[#EBEBE6] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="font-normal text-gray-700">Free Tier</span>
            </div>
            <span className="text-gray-500 font-normal">3 Artworks (Limit Reached)</span>
          </div>

          {/* Lite */}
          <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#EBEBE6] hover:border-[#1345EE]/40 transition-colors flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Check size={14} className="text-[#1345EE]" />
              <span className="font-medium text-gray-900">Lite Plan</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-[#141413]">50 Artworks</span>
              <span className="text-gray-500 font-normal ml-1">• ₹499/mo</span>
            </div>
          </div>

          {/* Pro */}
          <div
            style={{
              background:
                'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%) border-box',
              border: '1.5px solid transparent',
              boxShadow: '0px 3px 14px rgba(35, 77, 255, 0.08)',
            }}
            className="p-3 rounded-2xl flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <Check size={14} className="text-[#1345EE]" />
              <span className="font-medium text-gray-900">Pro Plan</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-[#1345EE]">Unlimited + COR Hub</span>
              <span className="text-gray-500 font-normal ml-1">• ₹999/mo</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          {/* Primary Upgrade Button */}
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
            className="w-full sm:flex-1 py-3 px-6 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98] select-none shadow-md group"
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
              <span>View Subscription Plans</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>

          {/* Secondary Dismiss Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-11 px-5 rounded-full border border-[#EBEBE6] text-xs font-normal text-gray-600 hover:bg-[#F9F9F7] hover:text-black transition-colors cursor-pointer"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';

interface Props {
  isLimited: boolean;
  label: string;
  className?: string;
}

export default function RestrictedUploadAction({ isLimited, label, className = '' }: Props) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Show the modal automatically on first render if limited
    if (isLimited) {
      setShowModal(true);
    }
  }, [isLimited]);

  // Set default class if not provided
  const buttonClass = className || "inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm";

  return (
    <>
      {isLimited ? (
        <button onClick={() => setShowModal(true)} className={buttonClass}>
          <Plus size={16} />
          {label}
        </button>
      ) : (
        <Link href="/portfolio/upload" className={buttonClass}>
          <Plus size={16} />
          {label}
        </Link>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="bg-white border border-gray-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-lg p-10 md:p-14 relative transform animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors"
              aria-label="Close"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            {/* Editorial Content */}
            <div className="text-center mt-2">
              <span className="text-[10px] font-bold tracking-[0.25em] text-gray-500 uppercase mb-4 block">
                Portfolio Limit Reached
              </span>
              <h2 className="text-4xl text-gray-900 mb-6 font-heading tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Curate Without Constraints.
              </h2>
              <div className="w-12 h-[1px] bg-gray-300 mx-auto mb-8"></div>
              
              <p className="text-[14px] text-gray-500 mb-10 leading-relaxed max-w-[90%] mx-auto font-medium">
                You have reached the maximum capacity of your free portfolio. Upgrade to a premium membership to continue exhibiting new artworks and unlock exclusive studio tools.
              </p>

              <div className="flex flex-col gap-4 items-center">
                <button
                  onClick={() => alert('Upgrade flow coming soon!')}
                  className="w-full sm:w-auto px-10 py-3.5 bg-gray-900 text-white text-[13px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors shadow-md"
                >
                  Unlock Premium
                </button>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-[11px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.1em] mt-2"
                >
                  Return to Studio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

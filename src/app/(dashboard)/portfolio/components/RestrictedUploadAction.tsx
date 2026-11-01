'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Props {
  isLimited: boolean;
  label: string;
  variant?: 'default' | 'gradient';
  className?: string;
  style?: React.CSSProperties;
}

export default function RestrictedUploadAction({
  isLimited,
  label,
  variant = 'gradient',
  className = '',
  style,
}: Props) {
  if (variant === 'gradient' && !className) {
    return (
      <Link
        href={isLimited ? '/subscription' : '/portfolio/upload'}
        title={isLimited ? 'Free upload limit reached. Redirecting to subscription plans.' : undefined}
        style={{
          position: 'relative',
          background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
          boxShadow:
            '0px 7px 22px rgba(35, 77, 255, 0.13), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
          overflow: 'hidden',
          borderRadius: 40,
          outline: '2px #2356FF solid',
          outlineOffset: '-2px',
          ...style,
        }}
        className="px-8 py-3.5 sm:px-10 sm:py-4 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98] group select-none shadow-md"
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
        <div
          style={{
            color: 'white',
            fontSize: 15,
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            fontWeight: '600',
            lineHeight: '24px',
          }}
          className="flex items-center gap-2 relative z-10"
        >
          <Plus size={18} className="text-white" />
          <span>{label}</span>
        </div>
      </Link>
    );
  }

  const buttonClass =
    className ||
    'inline-flex items-center gap-2 px-5 py-2.5 bg-[#141413] text-white border border-[#141413] rounded-full text-xs uppercase tracking-[0.08em] font-medium hover:bg-black transition-all cursor-pointer shadow-xs';

  return (
    <Link
      href={isLimited ? '/subscription' : '/portfolio/upload'}
      className={buttonClass}
      style={style}
      title={isLimited ? 'Free upload limit reached. Redirecting to subscription plans.' : undefined}
    >
      <Plus size={16} />
      {label}
    </Link>
  );
}

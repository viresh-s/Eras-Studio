'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Props {
  isLimited: boolean;
  label: string;
  className?: string;
}

export default function RestrictedUploadAction({ isLimited, label, className = '' }: Props) {
  // Pure monochrome styling matching ERAS design system
  const buttonClass =
    className ||
    'inline-flex items-center gap-2 px-5 py-2.5 bg-[#141413] text-white border border-[#141413] rounded-full text-xs uppercase tracking-[0.08em] font-medium hover:bg-black transition-all cursor-pointer shadow-xs';

  return (
    <Link
      href={isLimited ? '/subscription' : '/portfolio/upload'}
      className={buttonClass}
      title={isLimited ? 'Free upload limit reached. Redirecting to subscription plans.' : undefined}
    >
      <Plus size={16} />
      {label}
    </Link>
  );
}

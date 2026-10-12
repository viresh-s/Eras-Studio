import React from 'react';

interface CorStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

const statusColors: Record<string, string> = {
  // Application stages
  Recommended: 'bg-[#FAF5EC] text-[#865E16] border-[#EADFCF]',
  'Preparing Application': 'bg-[#F4F4F0] text-[#5A5A55] border-[#E8E8E3]',
  Applied: 'bg-[#EFF6FF] text-[#1E40AF] border-[#DBEAFE]',
  Screening: 'bg-[#F5F3FF] text-[#6D28D9] border-[#EDE9FE]',
  Interview: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
  'Final Round': 'bg-[#FFFBEB] text-[#B45309] border-[#FCD34D]',
  Offer: 'bg-[#EAF2EC] text-[#28633B] border-[#CCE2D2]',
  Rejected: 'bg-[#FEF2F2] text-[#991B1B] border-[#FEE2E2]',

  // Profile statuses
  'Under Review': 'bg-[#FAF5EC] text-[#865E16] border-[#EADFCF]',
  under_review: 'bg-[#FAF5EC] text-[#865E16] border-[#EADFCF]',
  Active: 'bg-[#EAF2EC] text-[#28633B] border-[#CCE2D2]',
  active: 'bg-[#EAF2EC] text-[#28633B] border-[#CCE2D2]',
  Draft: 'bg-[#F4F4F0] text-[#5A5A55] border-[#E8E8E3]',
  draft: 'bg-[#F4F4F0] text-[#5A5A55] border-[#E8E8E3]',
  paused: 'bg-[#FEF2F2] text-[#991B1B] border-[#FEE2E2]',

  // Consultation statuses
  scheduled: 'bg-[#EFF6FF] text-[#1E40AF] border-[#DBEAFE]',
  completed: 'bg-[#EAF2EC] text-[#28633B] border-[#CCE2D2]',
  cancelled: 'bg-[#FEF2F2] text-[#991B1B] border-[#FEE2E2]',
};

export default function CorStatusBadge({
  status,
  size = 'sm',
  className = '',
}: CorStatusBadgeProps) {
  const formatted = status === 'under_review' ? 'Under Review' : status === 'scheduled' ? 'Scheduled' : status;
  const colorClass = statusColors[status] || 'bg-[#F4F4F0] text-[#5A5A55] border-[#E8E8E3]';

  const sizeClass =
    size === 'sm'
      ? 'text-[11px] px-2.5 py-0.5 font-medium'
      : 'text-xs px-3 py-1 font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide uppercase transition-colors ${colorClass} ${sizeClass} ${className}`}
    >
      {formatted}
    </span>
  );
}

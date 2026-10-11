'use client';

import { useState } from 'react';
import { Flag, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReportUserModal from './ReportUserModal';

interface ReportUserButtonProps {
  reportedUserId: string;
  reportedUserName: string;
  currentUserId?: string | null;
  iconType?: 'flag' | 'triangle-alert';
  variant?: 'button' | 'icon-only';
  className?: string;
}

export default function ReportUserButton({
  reportedUserId,
  reportedUserName,
  currentUserId,
  iconType = 'flag',
  variant = 'button',
  className = '',
}: ReportUserButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      router.push('/login');
      return;
    }
    setIsModalOpen(true);
  };

  const Icon = iconType === 'triangle-alert' ? TriangleAlert : Flag;

  return (
    <>
      {variant === 'icon-only' ? (
        <button
          type="button"
          onClick={handleClick}
          title={`Report ${reportedUserName}`}
          className={`p-2.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50/70 border border-gray-200 transition-colors shadow-xs ${className}`}
          aria-label={`Report ${reportedUserName}`}
        >
          <Icon size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`px-5 py-3 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-2 border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50/60 ${className}`}
          aria-label={`Report ${reportedUserName}`}
        >
          <Icon size={14} className="text-current" />
          <span>Report User</span>
        </button>
      )}

      <ReportUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportedUserId={reportedUserId}
        reportedUserName={reportedUserName}
      />
    </>
  );
}

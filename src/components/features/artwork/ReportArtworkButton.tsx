'use client';

import { useState } from 'react';
import { Flag, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReportArtworkModal from './ReportArtworkModal';

interface ReportArtworkButtonProps {
  artworkId: string;
  artworkTitle: string;
  artworkOwnerId?: string | null;
  userId?: string | null;
  iconType?: 'flag' | 'triangle-alert';
  variant?: 'button' | 'icon-only';
  className?: string;
}

export default function ReportArtworkButton({
  artworkId,
  artworkTitle,
  artworkOwnerId,
  userId,
  iconType = 'flag',
  variant = 'button',
  className = '',
}: ReportArtworkButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    if (!userId) {
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
          title="Report this artwork"
          className={`p-2.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50/70 border border-gray-200 transition-colors shadow-xs ${className}`}
          aria-label="Report Artwork"
        >
          <Icon size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`px-5 py-3 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-2 border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50/60 ${className}`}
          aria-label="Report Artwork"
        >
          <Icon size={14} className="text-current" />
          <span>Report Artwork</span>
        </button>
      )}

      <ReportArtworkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        artworkId={artworkId}
        artworkTitle={artworkTitle}
        artworkOwnerId={artworkOwnerId}
      />
    </>
  );
}

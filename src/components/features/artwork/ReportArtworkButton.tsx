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
          className={`p-2.5 rounded-full text-[#6E6E69] hover:text-red-600 hover:bg-red-50/70 border border-[#E8E8E3] transition-colors shadow-2xs cursor-pointer ${className}`}
          aria-label="Report Artwork"
        >
          <Icon size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`btn-gradient-border-hover px-4 py-2.5 rounded-full text-xs font-medium shadow-2xs flex items-center gap-2 cursor-pointer ${className}`}
          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
          aria-label="Report Artwork"
        >
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

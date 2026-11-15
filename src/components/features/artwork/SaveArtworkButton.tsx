'use client';

import { useState, useTransition } from 'react';
import { toggleSaveArtwork } from '@/actions/saveArtworkActions';
import { useRouter } from 'next/navigation';

interface SaveArtworkButtonProps {
  artworkId: string;
  initialIsSaved: boolean;
  userId?: string;
}

export default function SaveArtworkButton({ artworkId, initialIsSaved, userId }: SaveArtworkButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const router = useRouter();

  const handleToggle = () => {
    if (!userId) {
      router.push('/login');
      return;
    }
    
    // Optimistic UI update
    const newIsSaved = !isSaved;
    setIsSaved(newIsSaved);

    startTransition(async () => {
      try {
        await toggleSaveArtwork(artworkId, isSaved);
      } catch (error) {
        // Revert on error
        console.error('Failed to toggle save state', error);
        setIsSaved(isSaved);
        alert('Could not save artwork. Ensure the saved_artworks table exists in your database.');
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-5 py-2.5 rounded-full text-xs font-medium transition-colors shadow-2xs flex items-center gap-2 cursor-pointer ${
        isSaved
          ? 'bg-[#141413] text-white hover:bg-black'
          : 'btn-gradient-border-hover'
      }`}
      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
    >
      <span>{isSaved ? 'Saved' : 'Save Artwork'}</span>
    </button>
  );
}

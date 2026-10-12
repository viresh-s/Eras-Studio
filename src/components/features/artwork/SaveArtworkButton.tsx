'use client';

import { useState, useTransition } from 'react';
import { toggleSaveArtwork } from '@/actions/saveArtworkActions';
import { Bookmark } from 'lucide-react';
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
      className={`px-6 py-3 rounded-full text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 ${
        isSaved
          ? 'bg-gray-900 text-white hover:bg-gray-800'
          : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'
      }`}
    >
      <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} className={isSaved ? 'text-white' : 'text-gray-900'} />
      {isSaved ? 'Saved' : 'Save Artwork'}
    </button>
  );
}

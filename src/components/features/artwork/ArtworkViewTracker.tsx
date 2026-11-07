'use client';

import { useEffect } from 'react';
import { recordArtworkView } from '@/actions/metricsActions';

interface ArtworkViewTrackerProps {
  artworkId: string;
  viewerId?: string | null;
  isOwner?: boolean;
}

export default function ArtworkViewTracker({ artworkId, viewerId, isOwner }: ArtworkViewTrackerProps) {
  useEffect(() => {
    // Do not increment views when the creator looks at their own artwork
    if (isOwner || !artworkId) return;

    try {
      const storageKey = `eras_view_art_${artworkId}`;
      const hasViewedInSession = sessionStorage.getItem(storageKey);

      if (!hasViewedInSession) {
        sessionStorage.setItem(storageKey, '1');
        recordArtworkView(artworkId, viewerId);
      }
    } catch {
      // If sessionStorage is unavailable (e.g. strict privacy mode), still record the view
      recordArtworkView(artworkId, viewerId);
    }
  }, [artworkId, viewerId, isOwner]);

  return null;
}


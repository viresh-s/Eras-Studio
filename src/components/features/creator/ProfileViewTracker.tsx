'use client';

import { useEffect } from 'react';
import { recordProfileView } from '@/actions/metricsActions';

interface ProfileViewTrackerProps {
  profileId: string;
  viewerId?: string | null;
  isOwner?: boolean;
}

export default function ProfileViewTracker({ profileId, viewerId, isOwner }: ProfileViewTrackerProps) {
  useEffect(() => {
    // Do not increment views when the creator looks at their own profile
    if (isOwner || !profileId) return;

    try {
      const storageKey = `eras_view_creator_${profileId}`;
      const hasViewedInSession = sessionStorage.getItem(storageKey);

      if (!hasViewedInSession) {
        sessionStorage.setItem(storageKey, '1');
        recordProfileView(profileId, viewerId);
      }
    } catch {
      recordProfileView(profileId, viewerId);
    }
  }, [profileId, viewerId, isOwner]);

  return null;
}


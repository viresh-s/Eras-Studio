'use client';

import React from 'react';
import CorLandingPage from './CorLandingPage';

interface CorLockedStateProps {
  isPaused?: boolean;
}

export default function CorLockedState({ isPaused = false }: CorLockedStateProps) {
  return (
    <div className="w-full">
      <CorLandingPage isPro={false} />
    </div>
  );
}

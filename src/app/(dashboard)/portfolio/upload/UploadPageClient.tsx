'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ArtworkUploadForm from '@/components/features/creator/ArtworkUploadForm';
import BulkArtworkUpload from '@/components/features/creator/BulkArtworkUpload';
import type { FreemiumStatus } from '@/lib/freemium/check';
import type { CollectionItem } from '@/actions/collectionActions';
import type { Profile } from '@/types/database';

interface UploadPageClientProps {
  userId: string;
  profile: Profile | null;
  collections: CollectionItem[];
  freemiumStatus: FreemiumStatus;
}

function UploadPageContent({ userId, profile, collections, freemiumStatus }: UploadPageClientProps) {
  const searchParams = useSearchParams();
  const initialMode = searchParams?.get('mode') === 'bulk' ? 'bulk' : 'single';
  const [mode, setMode] = useState<'single' | 'bulk'>(initialMode);

  return (
    <div>
      {/* Mode Toggle Pills */}
      <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
        <div className="flex items-center bg-white border border-[#E8E8E3] rounded-full p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer select-none ${
              mode === 'single'
                ? 'text-white shadow-md'
                : 'text-[#6E6E69] hover:text-[#141413]'
            }`}
            style={mode === 'single' ? {
              background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            } : {
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            }}
          >
            Single Artwork
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer select-none ${
              mode === 'bulk'
                ? 'text-white shadow-md'
                : 'text-[#6E6E69] hover:text-[#141413]'
            }`}
            style={mode === 'bulk' ? {
              background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            } : {
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            }}
          >
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Render active mode */}
      {mode === 'single' ? (
        <ArtworkUploadForm
          userId={userId}
          profile={profile}
          collections={collections}
          freemiumStatus={freemiumStatus}
        />
      ) : (
        <BulkArtworkUpload
          userId={userId}
          profile={profile}
          collections={collections}
          freemiumStatus={freemiumStatus}
        />
      )}
    </div>
  );
}

export default function UploadPageClient(props: UploadPageClientProps) {
  return (
    <Suspense fallback={
      <ArtworkUploadForm
        userId={props.userId}
        profile={props.profile}
        collections={props.collections}
        freemiumStatus={props.freemiumStatus}
      />
    }>
      <UploadPageContent {...props} />
    </Suspense>
  );
}

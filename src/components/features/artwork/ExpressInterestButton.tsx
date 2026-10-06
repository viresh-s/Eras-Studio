'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createChatSession } from '@/actions/chatActions';

interface ExpressInterestButtonProps {
  artworkId: string;
  creatorId: string;
  userId: string;
  initialChatId?: string;
  initialStatus?: string;
}

export default function ExpressInterestButton({ 
  artworkId, 
  creatorId, 
  userId, 
  initialChatId, 
  initialStatus 
}: ExpressInterestButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRequested, setIsRequested] = useState(!!initialChatId);

  // If the chat is already Active, show "Message" and let them go straight to the chat
  if (initialStatus === 'Active') {
    return (
      <button
        onClick={() => router.push(`/messages?chatId=${initialChatId}`)}
        className="px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
      >
        Open Message <span className="text-lg leading-none">→</span>
      </button>
    );
  }

  const handleExpressInterest = async () => {
    setIsLoading(true);

    try {
      await createChatSession(artworkId, userId, creatorId, 'I am interested in this artwork.');
      setIsRequested(true);
    } catch (err) {
      console.error('Failed to express interest:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isRequested) {
    return (
      <button
        disabled
        className="px-6 py-3 bg-gray-100 text-gray-500 rounded-full text-sm font-semibold cursor-not-allowed border border-gray-200"
      >
        Request Sent
      </button>
    );
  }

  return (
    <button
      onClick={handleExpressInterest}
      disabled={isLoading}
      className="px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Sending...' : 'Express Interest'} 
      {!isLoading && <span className="text-lg leading-none">→</span>}
    </button>
  );
}

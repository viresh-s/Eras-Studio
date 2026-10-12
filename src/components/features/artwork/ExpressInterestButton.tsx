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
  initialCreatedAt?: string;
}

export default function ExpressInterestButton({ 
  artworkId, 
  creatorId, 
  userId, 
  initialChatId, 
  initialStatus,
  initialCreatedAt
}: ExpressInterestButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [message, setMessage] = useState('I am interested in this artwork.');

  // Check if chat is expired (Pending for > 5 days)
  const isExpired = () => {
    if (initialStatus !== 'Pending' || !initialCreatedAt) return false;
    const createdAt = new Date(initialCreatedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 5;
  };

  const canResend = initialStatus === 'Rejected' || initialStatus === 'Closed' || isExpired();
  const isCurrentlyRequested = !!initialChatId && !canResend && initialStatus !== 'Active';

  const [isRequested, setIsRequested] = useState(isCurrentlyRequested);

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
      await createChatSession(artworkId, userId, creatorId, message.trim() || 'I am interested in this artwork.');
      setIsRequested(true);
      setShowInput(false);
    } catch (err) {
      console.error('Failed to express interest:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => !isRequested && setShowInput(true)}
        disabled={isLoading || isRequested}
        className={`px-6 py-3 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm ${
          isRequested 
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200'
            : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed'
        }`}
      >
        {isRequested ? 'Request Sent' : (canResend ? 'Resend Interest →' : 'Express Interest →')}
      </button>

      {showInput && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowInput(false)}
        >
          <div 
            className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-[17px] font-bold text-gray-900">Express Interest</h3>
              <button 
                onClick={() => setShowInput(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-[13px] font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Message to creator
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 focus:bg-white transition-all resize-none mb-2"
                rows={4}
                placeholder="Add a custom message..."
              />
              <p className="text-xs text-gray-500 mb-8 font-medium">This message will start a new conversation with the creator.</p>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowInput(false)}
                  disabled={isLoading}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExpressInterest}
                  disabled={isLoading || !message.trim()}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? 'Sending...' : 'Send Request →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

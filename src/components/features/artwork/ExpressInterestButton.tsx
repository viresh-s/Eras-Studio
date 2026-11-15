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
  isPriceOnRequest?: boolean;
  artworkTitle?: string;
}

export default function ExpressInterestButton({ 
  artworkId, 
  creatorId, 
  userId, 
  initialChatId, 
  initialStatus,
  initialCreatedAt,
  isPriceOnRequest = false,
  artworkTitle,
}: ExpressInterestButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  
  const defaultMessage = isPriceOnRequest
    ? `Hello, I would like to request the price and acquisition details for ${artworkTitle ? `"${artworkTitle}"` : 'this artwork'}.`
    : 'I am interested in this artwork.';

  const [message, setMessage] = useState(defaultMessage);

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
        className="btn-gradient-border-hover px-5 py-2.5 rounded-full text-xs font-medium shadow-2xs flex items-center gap-2 cursor-pointer"
        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
      >
        <span>Open Message</span>
      </button>
    );
  }

  const handleExpressInterest = async () => {
    setIsLoading(true);

    try {
      await createChatSession(artworkId, userId, creatorId, message.trim() || defaultMessage);
      setIsRequested(true);
      setShowInput(false);
    } catch (err) {
      console.error('Failed to send price/interest request:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonLabel = isRequested
    ? (isPriceOnRequest ? 'Price Requested' : 'Request Sent')
    : canResend
    ? (isPriceOnRequest ? 'Resend Price Request' : 'Resend Interest')
    : (isPriceOnRequest ? 'Request Price' : 'Express Interest');

  return (
    <>
      <button
        onClick={() => !isRequested && setShowInput(true)}
        disabled={isLoading || isRequested}
        className={`px-5 py-2.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2 shadow-2xs cursor-pointer ${
          isRequested 
            ? 'bg-gray-100 text-[#6E6E69] cursor-not-allowed border border-[#E8E8E3]'
            : 'btn-premium-gradient-pill text-white'
        }`}
        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
      >
        <span>{buttonLabel}</span>
      </button>

      {showInput && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141413]/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowInput(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-[#E8E8E3] shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
          >
            <div className="px-6 py-5 border-b border-[#E8E8E3] flex items-center justify-between bg-[#FDFDFC]">
              <h3
                className="text-lg font-serif italic font-normal text-[#141413]"
                style={{
                  fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                  fontStyle: 'italic',
                }}
              >
                {isPriceOnRequest ? 'Request Price' : 'Express Interest'}
              </h3>
              <button 
                onClick={() => setShowInput(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-[#6E6E69] hover:text-[#141413] hover:bg-gray-200 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-xs font-medium text-[#141413] mb-1.5 uppercase tracking-wide">
                {isPriceOnRequest ? 'Price inquiry to creator' : 'Message to creator'}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 bg-[#F9F9F8] border border-[#E8E8E3] rounded-xl text-xs text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#1345EE] focus:border-[#1345EE] focus:bg-white transition-all resize-none mb-2"
                rows={4}
                placeholder={isPriceOnRequest ? "Ask about pricing, dimensions, and acquisition details..." : "Add a custom message..."}
              />
              <p className="text-[11px] text-[#6E6E69] mb-6 font-normal">
                {isPriceOnRequest
                  ? "This will start a conversation with the creator to receive price and acquisition terms."
                  : "This message will start a new conversation with the creator."}
              </p>
              
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowInput(false)}
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-medium text-[#6E6E69] hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExpressInterest}
                  disabled={isLoading || !message.trim()}
                  className="btn-premium-gradient-pill px-5 py-2.5 text-white rounded-full text-xs font-medium shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isLoading ? 'Sending...' : (isPriceOnRequest ? 'Send Price Request' : 'Send Request')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

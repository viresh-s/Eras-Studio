'use client';

import { useState, useEffect, useRef } from 'react';
import { sendMessage } from '@/actions/chatActions';
import { useChatSubscription } from '@/hooks/useChatSubscription';
import { Send, ArrowLeft, Image } from 'lucide-react';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string; profile_pic_url: string | null };
}

interface ChatInterfaceProps {
  chatId: string;
  userId: string;
  otherPerson: { full_name: string; profile_pic_url: string | null };
  artwork: { title: string; image_url: string };
  initialMessages: ChatMessage[];
}

export default function ChatInterface({
  chatId,
  userId,
  otherPerson,
  artwork,
  initialMessages,
}: ChatInterfaceProps) {
  const messages = useChatSubscription(chatId, initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      await sendMessage(chatId, userId, content);
    } catch {
      setNewMessage(content); // Restore on error
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Chat Header */}
      <div className="border-b-4 border-brand-black bg-white p-4 flex items-center gap-4">
        <Link href="/messages" className="p-2 border-2 border-brand-black hover:bg-brand-yellow transition-colors">
          <ArrowLeft size={16} />
        </Link>

        <div className="w-10 h-10 border-2 border-brand-black bg-brand-lightgray flex-shrink-0 overflow-hidden">
          {artwork.image_url && (
            <img src={artwork.image_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold truncate">{artwork.title}</p>
          <p className="text-brand-gray text-sm">with {otherPerson.full_name}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-brand-offwhite">
        {messages.map((message) => {
          const isMine = message.sender_id === userId;

          return (
            <div
              key={message.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] border-3 border-brand-black p-3 ${
                  isMine
                    ? 'bg-brand-blue text-white shadow-brutal-sm'
                    : 'bg-white shadow-brutal-sm'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-brand-gray'}`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t-4 border-brand-black bg-white p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="input-brutal flex-1"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className={`btn-brutal px-4 ${
              !newMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

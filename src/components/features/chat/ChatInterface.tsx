'use client';

import { useState, useEffect, useRef } from 'react';
import { sendMessage } from '@/actions/chatActions';
import { useChatSubscription } from '@/hooks/useChatSubscription';
import { Send, ArrowLeft } from 'lucide-react';
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
      <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-4">
        <Link href="/messages" className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={16} />
        </Link>

        <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
          {artwork.image_url && (
            <img src={artwork.image_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate text-sm">{artwork.title}</p>
          <p className="text-gray-500 text-xs">with {otherPerson.full_name}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((message) => {
          const isMine = message.sender_id === userId;

          return (
            <div
              key={message.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  isMine
                    ? 'bg-gray-900 text-white'
                    : 'bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)]'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1.5 ${isMine ? 'text-gray-400' : 'text-gray-400'}`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-full outline-none transition-all duration-200 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 focus:bg-white"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className={`w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center transition-all hover:bg-gray-800 hover:scale-[1.02] ${
              !newMessage.trim() ? 'opacity-40 cursor-not-allowed hover:scale-100' : ''
            }`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

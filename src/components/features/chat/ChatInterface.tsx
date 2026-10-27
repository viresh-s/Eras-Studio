'use client';

import { useState, useEffect, useRef } from 'react';
import { sendMessage } from '@/actions/chatActions';
import { useChatSubscription } from '@/hooks/useChatSubscription';
import { Send, ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
  otherPerson: { id?: string; full_name: string; profile_pic_url: string | null };
  artwork: { id?: string; title: string; image_url: string };
  initialMessages: ChatMessage[];
}

const getInitials = (name?: string | null) => {
  if (!name) return 'A';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

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
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherPersonId = otherPerson?.id;

  useEffect(() => {
    if (!chatId || !userId) return;
    const supabase = createClient();
    const channelName = `chat-presence:${chatId}`;

    for (const ch of supabase.getChannels()) {
      if (ch.topic === `realtime:${channelName}` || ch.topic === channelName) {
        supabase.removeChannel(ch);
      }
    }

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    const syncPresence = () => {
      const state = channel.presenceState();
      if (otherPersonId) {
        setIsOnline(Boolean(state[otherPersonId]));
      }
    };

    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track({
              user_id: userId,
              online_at: new Date().toISOString(),
            });
          } catch {
            // Ignore presence errors
          }
          syncPresence();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, userId, otherPersonId]);

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
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const contactName = otherPerson?.full_name || 'Studio Participant';

  return (
    <div
      style={{
        background: '#F3F3F3',
        borderRadius: 20,
        outline: '0.50px #E4E4E4 solid',
        outlineOffset: '-0.25px',
      }}
      className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] overflow-hidden shadow-xs"
    >
      {/* Chat Header */}
      <div
        style={{
          background: 'white',
          borderBottom: '0.50px #ECEEF2 solid',
        }}
        className="h-16 px-5 sm:px-6 flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="p-1.5 -ml-1 text-[#8A909D] hover:text-[#171E2C] rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0 shadow-2xs">
            {otherPerson?.profile_pic_url ? (
              <img src={otherPerson.profile_pic_url} alt="" className="w-full h-full object-cover" />
            ) : (
              getInitials(contactName)
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3
                style={{
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  fontWeight: 500,
                  color: '#171E2C',
                }}
                className="text-sm sm:text-[15px]"
              >
                {contactName}
              </h3>
              {isOnline && (
                <div
                  style={{
                    background: '#26BD68',
                    boxShadow: '0px 0px 4px #26BD68',
                    borderRadius: 9999,
                  }}
                  className="w-2 h-2 shrink-0 animate-pulse"
                  title="Online"
                />
              )}
            </div>
            <p
              style={{
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                color: '#8A909D',
              }}
              className="text-[11px]"
            >
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F3F3F3]">
        {/* Artwork Card Attachment */}
        {artwork && (
          <div className="flex items-end gap-2.5 max-w-sm">
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-bold text-white bg-[#8C3EF2] shadow-2xs mb-1">
              {otherPerson?.profile_pic_url ? (
                <img src={otherPerson.profile_pic_url} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(contactName)
              )}
            </div>

            <div
              style={{
                background: '#E7E7E7',
                borderTopLeftRadius: 14,
                borderTopRightRadius: 14,
                borderBottomRightRadius: 14,
                borderBottomLeftRadius: 2,
              }}
              className="p-3 shadow-2xs w-full"
            >
              <Link
                href={artwork.id ? `/artwork/${artwork.id}` : '#'}
                className="w-full h-44 rounded-xl overflow-hidden bg-gray-200 mb-2.5 shadow-2xs block cursor-pointer group"
              >
                {artwork.image_url ? (
                  <img
                    src={artwork.image_url}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Eye size={24} />
                  </div>
                )}
              </Link>

              <div className="flex items-center justify-between gap-2">
                <Link
                  href={artwork.id ? `/artwork/${artwork.id}` : '#'}
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 400,
                    color: '#2C2C2C',
                  }}
                  className="text-xs sm:text-[13px] truncate hover:underline hover:text-[#1345EE] transition-colors"
                >
                  {artwork.title}
                </Link>

                <Link
                  href={artwork.id ? `/artwork/${artwork.id}` : '#'}
                  style={{
                    background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                    boxShadow:
                      '0px 7.56px 23.76px rgba(35, 77, 255, 0.13), 0px 1px 3.24px rgba(255, 255, 255, 0.65) inset, 0px -13px 6.48px rgba(6, 42, 137, 0.33) inset',
                    borderRadius: 43.2,
                    border: '0.65px #2356FF solid',
                    color: 'white',
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 500,
                  }}
                  className="px-3.5 py-1 text-[11px] shrink-0 hover:brightness-110 active:scale-95 transition-all select-none shadow-sm cursor-pointer inline-flex items-center justify-center"
                >
                  View Art
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((message) => {
          const isMine = message.sender_id === userId;

          return (
            <div
              key={message.id}
              className={`flex items-end gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              {!isMine && (
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-bold text-white bg-[#8C3EF2] shadow-2xs mb-1">
                  {otherPerson?.profile_pic_url ? (
                    <img src={otherPerson.profile_pic_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(contactName)
                  )}
                </div>
              )}

              <div
                style={
                  isMine
                    ? {
                        background: '#1A1A1A',
                        borderTopLeftRadius: 14,
                        borderTopRightRadius: 14,
                        borderBottomRightRadius: 2,
                        borderBottomLeftRadius: 14,
                      }
                    : {
                        background: '#EAEAEA',
                        borderTopLeftRadius: 14,
                        borderTopRightRadius: 14,
                        borderBottomRightRadius: 14,
                        borderBottomLeftRadius: 2,
                      }
                }
                className="px-4 py-3 max-w-[80%] sm:max-w-[70%] shadow-2xs"
              >
                <p
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 400,
                    color: isMine ? 'white' : '#101828',
                  }}
                  className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words"
                >
                  {message.content}
                </p>
                <p
                  suppressHydrationWarning
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 500,
                    color: isMine ? 'rgba(255, 255, 255, 0.50)' : 'rgba(16, 24, 40, 0.50)',
                  }}
                  className={`text-[9.5px] sm:text-[10px] mt-1.5 ${isMine ? 'text-right' : 'text-left'}`}
                >
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3.5 sm:p-5 pt-2 bg-transparent shrink-0">
        <div
          style={{
            background: 'white',
            borderRadius: 40,
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          }}
          className="p-1.5 pl-5 sm:pl-6 flex items-center justify-between gap-3 border border-[#E8E8E3]"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type Your Message"
            style={{
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              fontWeight: 400,
            }}
            className="flex-1 bg-transparent text-xs sm:text-sm text-[#101828] placeholder:text-[rgba(0,0,0,0.35)] outline-none w-full"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            style={{
              background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
              boxShadow:
                '0px 7px 22px rgba(35, 77, 255, 0.13), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
              borderRadius: 40,
              border: '0.70px #2356FF solid',
              color: 'white',
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              fontWeight: 500,
            }}
            className="px-5 sm:px-6 py-2.5 text-xs sm:text-[13px] flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 select-none shadow-md shrink-0"
          >
            <span>Send</span>
            <Send size={13} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

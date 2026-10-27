'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Send,
  ArrowLeft,
  MoreHorizontal,
  ExternalLink,
  MessageCircle,
  Eye,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { acceptChatRequest, sendMessage, rejectChatRequest } from '@/actions/chatActions';
import { createClient } from '@/lib/supabase/client';
import ReportUserButton from '@/components/features/user/ReportUserButton';

// Palette for contacts without a profile picture
const AVATAR_COLORS = ['#8C3EF2', '#FFAE4C', '#F31C85', '#1345EE', '#7324DB', '#26BD68'];
const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (name?: string | null) => {
  if (!name) return 'A';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const formatChatTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

interface ChatListClientProps {
  initialChats: any[];
  currentUserId: string;
}

export default function ChatListClient({ initialChats, currentUserId }: ChatListClientProps) {
  const searchParams = useSearchParams();
  const initialChatId = searchParams?.get('chatId');

  const [activeTab, setActiveTab] = useState<'Requests' | 'Messages'>(initialChatId ? 'Messages' : 'Messages');
  const [chats, setChats] = useState(initialChats);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);

  // Real-time Presence: track online status for contacts across the platform
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();
    const channelName = 'online-presence';

    // Purge any stale channel instance before subscribing
    for (const ch of supabase.getChannels()) {
      if (ch.topic === `realtime:${channelName}` || ch.topic === channelName) {
        supabase.removeChannel(ch);
      }
    }

    const channel = supabase.channel(channelName, {
      config: { presence: { key: currentUserId } },
    });

    const syncPresence = () => {
      const state = channel.presenceState();
      setOnlineUserIds(new Set(Object.keys(state)));
    };

    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track({
              user_id: currentUserId,
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
  }, [currentUserId]);

  const pendingChats = useMemo(() => {
    return chats.filter((c) => {
      if (c.status !== 'Pending') return false;
      const createdAt = new Date(c.created_at);
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 5;
    });
  }, [chats]);

  const activeChats = useMemo(() => {
    return chats.filter((c) => c.status === 'Active');
  }, [chats]);

  // Ensure an active chat is selected by default on desktop if available
  useEffect(() => {
    if (activeTab === 'Messages') {
      if (initialChatId && activeChats.some((c) => c.id === initialChatId)) {
        setSelectedChatId(initialChatId);
      } else if (!selectedChatId && activeChats.length > 0) {
        setSelectedChatId(activeChats[0].id);
      }
    }
  }, [activeTab, activeChats, initialChatId, selectedChatId]);

  // Filtered active conversations for search
  const filteredActiveChats = useMemo(() => {
    if (!searchQuery.trim()) return activeChats;
    const query = searchQuery.toLowerCase().trim();
    return activeChats.filter((chat) => {
      const isGuest = chat.guest_id === currentUserId;
      const otherPerson = isGuest ? chat.creator : chat.guest;
      const nameMatch = (otherPerson?.full_name || '').toLowerCase().includes(query);
      const artMatch = (chat.artworks?.title || '').toLowerCase().includes(query);
      return nameMatch || artMatch;
    });
  }, [activeChats, searchQuery, currentUserId]);

  const handleTabChange = (tab: 'Requests' | 'Messages') => {
    setActiveTab(tab);
    if (tab === 'Messages' && activeChats.length > 0 && !selectedChatId) {
      setSelectedChatId(activeChats[0].id);
    }
  };

  const handleAccept = async (chatId: string) => {
    const previousChats = [...chats];
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, status: 'Active' } : c))
    );
    setLoadingIds((prev) => ({ ...prev, [chatId]: true }));
    try {
      await acceptChatRequest(chatId);
      setSelectedChatId(chatId);
      setActiveTab('Messages');
    } catch (err) {
      console.error('Failed to accept chat request:', err);
      setChats(previousChats);
      alert('Failed to accept request. Please try again.');
    } finally {
      setLoadingIds((prev) => ({ ...prev, [chatId]: false }));
    }
  };

  const handleReject = async (chatId: string) => {
    const previousChats = [...chats];
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, status: 'Rejected' } : c))
    );
    setLoadingIds((prev) => ({ ...prev, [chatId]: true }));
    try {
      await rejectChatRequest(chatId);
    } catch (err) {
      console.error('Failed to reject chat request:', err);
      setChats(previousChats);
      alert('Failed to reject request. Please try again.');
    } finally {
      setLoadingIds((prev) => ({ ...prev, [chatId]: false }));
    }
  };

  const selectedChat = useMemo(() => {
    return activeChats.find((c) => c.id === selectedChatId) || null;
  }, [activeChats, selectedChatId]);

  return (
    <div className="w-full">
      {/* 1. TOP HEADER: "Your Inbox" on left, Segmented Pill Toggle on right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 px-1">
        <div>
          <h1
            style={{
              fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 700,
              color: '#2D2D2D',
            }}
            className="text-3xl sm:text-4xl tracking-tight"
          >
            Your Inbox
          </h1>
        </div>

        {/* Segmented Pill Toggle (Requests vs Messages) */}
        <div
          style={{
            background: 'rgba(217, 217, 217, 0.30)',
            borderRadius: 9999,
          }}
          className="p-1 sm:p-1.5 inline-flex items-center gap-1 self-start sm:self-auto border border-black/5 shadow-2xs"
        >
          {/* Requests Tab */}
          <button
            type="button"
            onClick={() => handleTabChange('Requests')}
            style={
              activeTab === 'Requests'
                ? {
                    background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                    boxShadow:
                      '0px 7.56px 23.76px rgba(35, 77, 255, 0.13), 0px 1px 3.24px rgba(255, 255, 255, 0.65) inset, 0px -13px 6.48px rgba(6, 42, 137, 0.33) inset',
                    borderRadius: 43.2,
                    border: '0.65px #2356FF solid',
                    color: 'white',
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 500,
                  }
                : {
                    color: 'black',
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 500,
                  }
            }
            className={`px-5 sm:px-6 py-2 text-xs sm:text-[13px] rounded-full transition-all duration-200 cursor-pointer select-none flex items-center gap-1.5 ${
              activeTab === 'Requests' ? 'shadow-md' : 'hover:text-black hover:bg-black/5'
            }`}
          >
            <span>Requests</span>
            {pendingChats.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  activeTab === 'Requests' ? 'bg-white text-blue-700' : 'bg-black text-white'
                }`}
              >
                {pendingChats.length}
              </span>
            )}
          </button>

          {/* Messages Tab */}
          <button
            type="button"
            onClick={() => handleTabChange('Messages')}
            style={
              activeTab === 'Messages'
                ? {
                    background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                    boxShadow:
                      '0px 7.56px 23.76px rgba(35, 77, 255, 0.13), 0px 1px 3.24px rgba(255, 255, 255, 0.65) inset, 0px -13px 6.48px rgba(6, 42, 137, 0.33) inset',
                    borderRadius: 43.2,
                    border: '0.65px #2356FF solid',
                    color: 'white',
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 500,
                  }
                : {
                    color: 'black',
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 500,
                  }
            }
            className={`px-5 sm:px-6 py-2 text-xs sm:text-[13px] rounded-full transition-all duration-200 cursor-pointer select-none flex items-center gap-1.5 ${
              activeTab === 'Messages' ? 'shadow-md' : 'hover:text-black hover:bg-black/5'
            }`}
          >
            <span>Messages</span>
            {activeChats.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  activeTab === 'Messages' ? 'bg-white text-blue-700' : 'bg-black text-white'
                }`}
              >
                {activeChats.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. MAIN ENCLOSING CARD (#F6F7F8 with smooth 24px/28px rounded borders) */}
      <div
        style={{
          background: '#F6F7F8',
          borderRadius: 24,
        }}
        className="p-4 sm:p-6 lg:p-7 border border-[#ECEEF1] shadow-2xs overflow-hidden"
      >
        {/* ======================================================== */}
        {/* TAB 1: MESSAGES (Split-view Sidebar + Conversation Pane) */}
        {/* ======================================================== */}
        {activeTab === 'Messages' && (
          <div className="flex flex-col md:flex-row gap-5 lg:gap-6 min-h-[580px] md:h-[680px] lg:h-[720px]">
            {/* LEFT SIDEBAR: Conversations List */}
            <div
              style={{
                background: '#FDFDFE',
                borderRadius: 16,
              }}
              className={`w-full md:w-[310px] lg:w-[340px] shrink-0 p-4 sm:p-5 flex flex-col border border-[#ECEEF1] shadow-2xs ${
                selectedChatId ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Search Bar */}
              <div
                style={{
                  background: '#F3F4F6',
                  borderRadius: 12,
                }}
                className="px-3.5 py-2.5 flex items-center gap-2.5 border border-transparent focus-within:border-gray-300 focus-within:bg-white transition-all mb-4"
              >
                <Search size={15} className="text-[#8A909D] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  }}
                  className="bg-transparent text-xs sm:text-[13px] text-[#171E2C] placeholder-[#7E8491] outline-none w-full"
                />
              </div>

              {/* Conversations Title & Count Badge */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h2
                    style={{
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      fontWeight: 500,
                      color: '#171E2C',
                    }}
                    className="text-xs sm:text-[13.5px]"
                  >
                    Conversations
                  </h2>
                  <div
                    style={{
                      background: '#10131B',
                      borderRadius: 9999,
                    }}
                    className="w-5 h-5 flex items-center justify-center text-white text-[10.5px] font-semibold font-mono"
                  >
                    {filteredActiveChats.length}
                  </div>
                </div>
              </div>

              {/* Scrollable Conversation Items */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 -mr-1">
                {filteredActiveChats.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#7E8491]">
                    <MessageCircle size={28} className="text-[#8A909D]/60 mb-2" />
                    <p
                      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                      className="text-xs font-medium text-[#171E2C]"
                    >
                      No conversations found
                    </p>
                    <p className="text-[11px] text-[#7E8491] mt-1">
                      {searchQuery ? 'Try adjusting your search query' : 'Your active chats will appear here'}
                    </p>
                  </div>
                ) : (
                  filteredActiveChats.map((chat) => {
                    const isGuest = chat.guest_id === currentUserId;
                    const otherPerson = isGuest ? chat.creator : chat.guest;
                    const artwork = chat.artworks;
                    const isSelected = selectedChatId === chat.id;
                    const contactName = otherPerson?.full_name || 'Studio Participant';
                    const avatarColor = getAvatarColor(contactName);
                    const isContactOnline = otherPerson?.id ? onlineUserIds.has(otherPerson.id) : false;

                    const formattedTime = formatChatTime(chat.created_at);

                    return (
                      <button
                        key={chat.id}
                        type="button"
                        onClick={() => setSelectedChatId(chat.id)}
                        style={{
                          background: isSelected ? '#F1F2FF' : 'transparent',
                          borderRadius: 12,
                        }}
                        className={`w-full p-2.5 sm:p-3 flex items-center gap-3 transition-colors text-left cursor-pointer group ${
                          isSelected ? '' : 'hover:bg-white active:bg-gray-100'
                        }`}
                      >
                        {/* Avatar with Realtime Online Indicator */}
                        <div className="relative shrink-0">
                          <div
                            style={{
                              background: otherPerson?.profile_pic_url ? '#E5E5E5' : avatarColor,
                              borderRadius: 9999,
                            }}
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white shadow-2xs"
                          >
                            {otherPerson?.profile_pic_url ? (
                              <img
                                src={otherPerson.profile_pic_url}
                                alt={contactName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getInitials(contactName)
                            )}
                          </div>
                          {isContactOnline && (
                            <span
                              style={{
                                background: '#26BD68',
                                boxShadow: '0px 0px 4px #26BD68',
                              }}
                              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white"
                              title="Online"
                            />
                          )}
                        </div>

                        {/* Text info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p
                              style={{
                                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                                fontWeight: 500,
                                color: '#171E2C',
                              }}
                              className="text-xs sm:text-[13px] truncate"
                            >
                              {contactName}
                            </p>
                            <span
                              suppressHydrationWarning
                              style={{
                                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                                color: '#8A909D',
                              }}
                              className="text-[10px] sm:text-[11px] shrink-0"
                            >
                              {formattedTime}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <p
                              style={{
                                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                                color: isSelected ? '#1345EE' : '#7E8491',
                              }}
                              className="text-[11px] sm:text-xs truncate"
                            >
                              {artwork?.title ? `Inquiry on "${artwork.title}"` : 'Conversation active'}
                            </p>

                            {/* Unread dot or indicator */}
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-[#1345EE] shrink-0" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT MAIN PANEL: Active Conversation View */}
            <div
              style={{
                background: '#F3F3F3',
                borderRadius: 18,
                outline: '0.50px #E4E4E4 solid',
                outlineOffset: '-0.25px',
              }}
              className={`flex-1 min-w-0 flex flex-col overflow-hidden shadow-xs relative ${
                !selectedChatId ? 'hidden md:flex' : 'flex'
              }`}
            >
              {selectedChat ? (
                <ConversationActiveView
                  chat={selectedChat}
                  currentUserId={currentUserId}
                  isOnline={
                    (() => {
                      const other = selectedChat.guest_id === currentUserId ? selectedChat.creator : selectedChat.guest;
                      return other?.id ? onlineUserIds.has(other.id) : false;
                    })()
                  }
                  onBack={() => setSelectedChatId(null)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#7E8491]">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[#1345EE] shadow-sm mb-4">
                    <MessageCircle size={28} />
                  </div>
                  <h3
                    style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                    className="text-base font-semibold text-[#171E2C] mb-1"
                  >
                    Select a conversation
                  </h3>
                  <p className="text-xs text-[#7E8491] max-w-xs">
                    Choose an inquiry from the left sidebar to read messages, discuss works, and connect.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: REQUESTS (Artwork Inquiries & Price Requests View) */}
        {/* ======================================================== */}
        {activeTab === 'Requests' && (
          <div className="min-h-[500px]">
            <div className="flex items-center justify-between mb-5 px-1">
              <div className="flex items-center gap-2">
                <h2
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 500,
                    color: '#171E2C',
                  }}
                  className="text-sm sm:text-base"
                >
                  Pending Requests
                </h2>
                <div
                  style={{
                    background: '#10131B',
                    borderRadius: 9999,
                  }}
                  className="w-5 h-5 flex items-center justify-center text-white text-[11px] font-semibold font-mono"
                >
                  {pendingChats.length}
                </div>
              </div>
              <p className="text-xs text-[#7E8491] hidden sm:block">
                Direct artwork inquiries awaiting your response
              </p>
            </div>

            {pendingChats.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {pendingChats.map((chat) => {
                  const isGuest = chat.guest_id === currentUserId;
                  const otherPerson = isGuest ? chat.creator : chat.guest;
                  const artwork = chat.artworks;
                  const artworkId = chat.artwork_id || artwork?.id;
                  const contactName = otherPerson?.full_name || 'Collector';
                  const avatarColor = getAvatarColor(contactName);
                  const formattedDate = new Date(chat.created_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={chat.id}
                      style={{
                        background: 'white',
                        borderRadius: 20,
                        border: '1px solid #ECEEF2',
                      }}
                      className="p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row gap-5"
                    >
                      {/* Artwork Thumbnail */}
                      <Link
                        href={artworkId ? `/artwork/${artworkId}` : '#'}
                        className="w-full sm:w-32 h-32 rounded-2xl bg-gray-100 shrink-0 overflow-hidden relative shadow-2xs block cursor-pointer group"
                      >
                        {artwork?.image_url ? (
                          <img
                            src={artwork.image_url}
                            alt={artwork.title || 'Artwork'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Eye size={24} />
                          </div>
                        )}
                      </Link>

                      {/* Info & Actions */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          {/* Contact Header */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                style={{
                                  background: otherPerson?.profile_pic_url ? '#E5E5E5' : avatarColor,
                                  borderRadius: 9999,
                                }}
                                className="w-7 h-7 rounded-full overflow-hidden text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                              >
                                {otherPerson?.profile_pic_url ? (
                                  <img
                                    src={otherPerson.profile_pic_url}
                                    alt={contactName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  getInitials(contactName)
                                )}
                              </div>
                              <span
                                style={{
                                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                                  fontWeight: 500,
                                  color: '#171E2C',
                                }}
                                className="text-xs sm:text-[13px] truncate"
                              >
                                {contactName}
                              </span>
                            </div>

                            <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase shrink-0">
                              Pending
                            </span>
                          </div>

                          {/* Artwork Title & Message Snippet */}
                          <h3
                            style={{
                              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                              fontWeight: 600,
                              color: '#101828',
                            }}
                            className="text-sm truncate mb-1"
                          >
                            {isGuest ? 'Your inquiry on ' : 'Interest in '}&ldquo;{artwork?.title}&rdquo;
                          </h3>
                          <p className="text-xs text-[#7E8491] line-clamp-2 leading-relaxed mb-3">
                            &ldquo;I am interested in this artwork and would like to learn more about its acquisition.&rdquo;
                          </p>
                        </div>

                        {/* Bottom Row / Action Buttons */}
                        <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between gap-3">
                          <span suppressHydrationWarning className="text-[11px] text-[#8A909D] font-mono">{formattedDate}</span>

                          {isGuest ? (
                            <span className="text-xs text-[#71716D] font-medium bg-gray-100 px-3 py-1 rounded-full">
                              Waiting for creator response
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Accept Button with Signature Blue Linear Gradient */}
                              <button
                                type="button"
                                disabled={loadingIds[chat.id]}
                                onClick={() => handleAccept(chat.id)}
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
                                className="px-5 py-2 text-xs cursor-pointer hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 select-none shadow-sm"
                              >
                                {loadingIds[chat.id] ? 'Accepting...' : 'Accept Request'}
                              </button>

                              {/* Reject Button */}
                              <button
                                type="button"
                                disabled={loadingIds[chat.id]}
                                onClick={() => handleReject(chat.id)}
                                className="px-4 py-2 text-xs font-medium text-[#7E8491] hover:text-red-600 transition-colors cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  background: 'white',
                  borderRadius: 20,
                  border: '1px solid #ECEEF2',
                }}
                className="p-16 text-center shadow-xs max-w-lg mx-auto"
              >
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Check size={26} />
                </div>
                <h3
                  style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                  className="text-base font-semibold text-[#171E2C] mb-1"
                >
                  All caught up!
                </h3>
                <p className="text-xs text-[#7E8491] mb-6">
                  You don&apos;t have any pending requests. Switch over to Messages to check on ongoing conversations.
                </p>
                <button
                  type="button"
                  onClick={() => handleTabChange('Messages')}
                  style={{
                    background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                    borderRadius: 40,
                    border: '0.70px #2356FF solid',
                    color: 'white',
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 500,
                  }}
                  className="px-6 py-2.5 text-xs font-semibold cursor-pointer shadow-md hover:brightness-110 transition-all inline-flex items-center gap-2"
                >
                  <span>Go to Messages</span>
                  <span className="text-sm">→</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// Active Conversation Pane (Header + Message Stream + White Input Capsule)
// =========================================================================
function ConversationActiveView({
  chat,
  currentUserId,
  isOnline,
  onBack,
}: {
  chat: any;
  currentUserId: string;
  isOnline: boolean;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isGuest = chat.guest_id === currentUserId;
  const otherPerson = isGuest ? chat.creator : chat.guest;
  const artwork = chat.artworks;
  const artworkId = chat.artwork_id || artwork?.id;
  const contactName = otherPerson?.full_name || 'Studio Participant';
  const avatarColor = getAvatarColor(contactName);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial messages and set up realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channelName = `chat:${chat.id}`;

    // 1. Fetch initial messages
    supabase
      .from('messages')
      .select('*, profiles(full_name, profile_pic_url)')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data || []));

    // 2. Purge stale channel before creating new one
    for (const ch of supabase.getChannels()) {
      if (ch.topic === `realtime:${channelName}` || ch.topic === channelName) {
        supabase.removeChannel(ch);
      }
    }

    // 3. Realtime Postgres Changes
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chat.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      await sendMessage(chat.id, currentUserId, content);
    } catch (err) {
      console.error('Failed to send message:', err);
      setNewMessage(content); // Restore input on failure
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

  const formatMessageTime = (dateStr: string) => formatChatTime(dateStr);

  return (
    <>
      {/* 1. CHAT HEADER: White bar with Avatar, Name + Online Green Dot, Subtitle, and Three Dots Action */}
      <div
        style={{
          background: 'white',
          borderBottom: '0.50px #ECEEF2 solid',
        }}
        className="h-16 sm:h-[68px] px-5 sm:px-6 flex items-center justify-between shrink-0 rounded-t-[18px] relative z-20"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-[#8A909D] hover:text-[#171E2C] rounded-lg transition-colors cursor-pointer"
            aria-label="Back to conversations"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Contact Avatar */}
          <div className="relative shrink-0">
            <div
              style={{
                background: otherPerson?.profile_pic_url ? '#E5E5E5' : avatarColor,
                borderRadius: 9999,
              }}
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white shadow-2xs"
            >
              {otherPerson?.profile_pic_url ? (
                <img
                  src={otherPerson.profile_pic_url}
                  alt={contactName}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(contactName)
              )}
            </div>
            {isOnline && (
              <span
                style={{
                  background: '#26BD68',
                  boxShadow: '0px 0px 4px #26BD68',
                }}
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white"
                title="Online"
              />
            )}
          </div>

          {/* Name & Online Status */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3
                style={{
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  fontWeight: 500,
                  color: '#171E2C',
                }}
                className="text-sm sm:text-[15px] truncate"
              >
                {contactName}
              </h3>
              {/* Online indicator green dot - only when online */}
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
                fontWeight: 400,
                color: '#8A909D',
              }}
              className="text-[11px] leading-tight"
            >
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Right side: Three Dots Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-[#8A909D] hover:text-[#171E2C] rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="More options"
          >
            <MoreHorizontal size={20} />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div
              style={{
                background: 'white',
                borderRadius: 14,
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              }}
              className="absolute right-0 top-11 w-48 border border-gray-100 p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
            >
              {artworkId && (
                <Link
                  href={`/artwork/${artworkId}`}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#171E2C] hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <Eye size={14} className="text-[#8A909D]" />
                  <span>View Artwork</span>
                </Link>
              )}
              {otherPerson?.id && (
                <Link
                  href={`/artist/${otherPerson.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#171E2C] hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <ExternalLink size={14} className="text-[#8A909D]" />
                  <span>View Profile</span>
                </Link>
              )}
              <div className="border-t border-gray-100 my-1" />
              <div className="px-2 py-1">
                <ReportUserButton
                  reportedUserId={otherPerson?.id}
                  reportedUserName={contactName}
                  currentUserId={currentUserId}
                  variant="icon-only"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. MESSAGES STREAM: Clean light-gray background (#F3F3F3) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-4">
        {/* Top Attached Artwork Card (Exact Design from Reference) */}
        {artwork && (
          <div className="flex items-end gap-2.5 max-w-sm sm:max-w-md">
            {/* Contact Avatar at Bottom Left */}
            <div
              style={{
                background: otherPerson?.profile_pic_url ? '#E5E5E5' : avatarColor,
                borderRadius: 9999,
              }}
              className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-bold text-white shadow-2xs mb-1"
            >
              {otherPerson?.profile_pic_url ? (
                <img
                  src={otherPerson.profile_pic_url}
                  alt={contactName}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(contactName)
              )}
            </div>

            {/* Artwork Card Bubble */}
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
              {/* Artwork Image Link */}
              <Link
                href={artworkId ? `/artwork/${artworkId}` : '#'}
                className="w-full h-44 sm:h-48 rounded-xl overflow-hidden bg-gray-200 mb-2.5 shadow-2xs block cursor-pointer group"
              >
                {artwork.image_url ? (
                  <img
                    src={artwork.image_url}
                    alt={artwork.title || 'Artwork'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Eye size={24} />
                  </div>
                )}
              </Link>

              {/* Title & "View Art" Action Row */}
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={artworkId ? `/artwork/${artworkId}` : '#'}
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 400,
                    color: '#2C2C2C',
                  }}
                  className="text-xs sm:text-[13px] truncate hover:underline hover:text-[#1345EE] transition-colors"
                >
                  {artwork.title || 'Untitled Artwork'}
                </Link>

                <Link
                  href={artworkId ? `/artwork/${artworkId}` : '#'}
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

              {/* Timestamp */}
              <p
                suppressHydrationWarning
                style={{
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  fontWeight: 500,
                  color: 'rgba(0, 0, 0, 0.50)',
                }}
                className="text-[10px] mt-1.5"
              >
                {formatMessageTime(chat.created_at)}
              </p>
            </div>
          </div>
        )}

        {/* Chronological Messages */}
        {messages.map((message) => {
          const isMine = message.sender_id === currentUserId;

          return (
            <div
              key={message.id}
              className={`flex items-end gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              {/* Incoming Avatar */}
              {!isMine && (
                <div
                  style={{
                    background: otherPerson?.profile_pic_url ? '#E5E5E5' : avatarColor,
                    borderRadius: 9999,
                  }}
                  className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-bold text-white shadow-2xs mb-1"
                >
                  {otherPerson?.profile_pic_url ? (
                    <img
                      src={otherPerson.profile_pic_url}
                      alt={contactName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(contactName)
                  )}
                </div>
              )}

              {/* Message Bubble */}
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
                  {formatMessageTime(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. BOTTOM INPUT CAPSULE: White rounded-full capsule with signature blue gradient "Send" button */}
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

          {/* Send Button with Signature Blue Linear Gradient */}
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
            className="px-5 sm:px-6 py-2.5 sm:py-2.5 text-xs sm:text-[13px] flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none shadow-md shrink-0"
          >
            <span>Send</span>
            <Send size={13} className="text-white" />
          </button>
        </div>
      </div>
    </>
  );
}

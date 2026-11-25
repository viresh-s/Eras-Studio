'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { acceptChatRequest, sendMessage, rejectChatRequest, deleteMessage } from '@/actions/chatActions';
import { createClient } from '@/lib/supabase/client';
import ReportUserModal from '@/components/features/user/ReportUserModal';

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

interface ParsedMessage {
  reply?: {
    id: string;
    name: string;
    snippet: string;
  };
  text: string;
}

function parseMessageContent(raw: string): ParsedMessage {
  if (typeof raw === 'string' && raw.startsWith('{"_reply":')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed._reply && typeof parsed.text === 'string') {
        return {
          reply: {
            id: String(parsed._reply.id || ''),
            name: String(parsed._reply.name || 'Participant'),
            snippet: String(parsed._reply.snippet || ''),
          },
          text: parsed.text,
        };
      }
    } catch {}
  }
  return { text: raw || '' };
}

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

  const isInitialMount = useRef(true);

  // Auto-select conversation:
  // - If initialChatId was specified in URL, open it on both mobile and desktop
  // - Otherwise, ONLY auto-select the first conversation on desktop screens (>= 768px)
  // - On mobile screens (< 768px), keep selectedChatId null so the user sees the conversations list!
  useEffect(() => {
    if (activeTab !== 'Messages') return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialChatId && activeChats.some((c) => c.id === initialChatId)) {
        setSelectedChatId(initialChatId);
        return;
      }
      if (typeof window !== 'undefined' && window.innerWidth >= 768 && activeChats.length > 0) {
        setSelectedChatId(activeChats[0].id);
      }
      return;
    }

    // On desktop, if active chat was closed or cleared and screen is >= 768px, fallback to first
    if (typeof window !== 'undefined' && window.innerWidth >= 768 && !selectedChatId && activeChats.length > 0) {
      setSelectedChatId(activeChats[0].id);
    }
  }, [activeTab, activeChats, initialChatId]);

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
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setSelectedChatId(activeChats[0].id);
      }
    }
  };

  const handleBackToConversations = () => {
    setSelectedChatId(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('chatId')) {
        url.searchParams.delete('chatId');
        window.history.replaceState(
          null,
          '',
          url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '')
        );
      }
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
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 px-1 ${
          selectedChatId ? 'hidden md:flex' : 'flex'
        }`}
      >
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
        className="p-2.5 sm:p-5 lg:p-7 border border-[#ECEEF1] shadow-2xs overflow-hidden"
      >
        {/* ======================================================== */}
        {/* TAB 1: MESSAGES (Split-view Sidebar + Conversation Pane) */}
        {/* ======================================================== */}
        {activeTab === 'Messages' && (
          <div className="flex flex-col md:flex-row gap-5 lg:gap-6 h-[calc(100dvh-130px)] min-h-[560px] md:h-[680px] lg:h-[720px]">
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
                className="px-3.5 py-2.5 flex items-center border border-transparent focus-within:border-gray-300 focus-within:bg-white transition-all mb-4"
              >
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
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[11px] text-[#7E8491] hover:text-[#171E2C] px-1.5 py-0.5 rounded cursor-pointer shrink-0 font-medium"
                  >
                    Clear
                  </button>
                )}
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
                    <p
                      style={{
                        fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                        fontStyle: 'italic',
                      }}
                      className="text-sm font-medium text-[#171E2C] mb-1"
                    >
                      {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                    </p>
                    <p className="text-[11px] text-[#7E8491] max-w-[210px] leading-relaxed">
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
                  onBack={handleBackToConversations}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#7E8491]">
                  <h3
                    style={{
                      fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                      fontStyle: 'italic',
                      fontWeight: 500,
                    }}
                    className="text-2xl text-[#141413] mb-2 tracking-tight"
                  >
                    Select a conversation
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7E8491] max-w-xs leading-relaxed">
                    Choose an inquiry from the sidebar to review details, discuss artwork, and connect directly.
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
                          <div className="w-full h-full flex items-center justify-center text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wider bg-[#ECECE7]">
                            {artwork?.title ? artwork.title.substring(0, 2).toUpperCase() : 'ART'}
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
                <h3
                  style={{
                    fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                    fontStyle: 'italic',
                    fontWeight: 500,
                  }}
                  className="text-2xl sm:text-3xl text-[#141413] mb-2 tracking-tight"
                >
                  All caught up
                </h3>
                <p className="text-xs sm:text-sm text-[#7E8491] mb-6 max-w-sm mx-auto leading-relaxed">
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
                  className="px-6 py-2.5 text-xs font-semibold cursor-pointer shadow-md hover:brightness-110 transition-all inline-flex items-center"
                >
                  Go to Messages
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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; content: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ message: any; x: number; y: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const isGuest = chat.guest_id === currentUserId;
  const otherPerson = isGuest ? chat.creator : chat.guest;
  const artwork = chat.artworks;
  const artworkId = chat.artwork_id || artwork?.id;
  const contactName = otherPerson?.full_name || 'Studio Participant';
  const avatarColor = getAvatarColor(contactName);

  // Close dropdown menu and context menu on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setContextMenu(null);
        setReplyingTo(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
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

    // 3. Realtime Postgres Changes (Insert & Delete)
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
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chat.id}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
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

  const handleInitiateReply = (msg: any) => {
    const isMine = msg.sender_id === currentUserId;
    const authorName = isMine ? 'You' : contactName;
    const { text } = parseMessageContent(msg.content);
    setReplyingTo({
      id: msg.id,
      senderName: authorName,
      content: text,
    });
    setContextMenu(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleDeleteMessage = async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    setContextMenu(null);
    try {
      await deleteMessage(messageId);
    } catch (err) {
      console.error('Failed to delete message:', err);
      const supabase = createClient();
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(full_name, profile_pic_url)')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    }
  };

  const handleOpenContextMenu = (message: any, clientX: number, clientY: number) => {
    const menuWidth = 140;
    const menuHeight = message.sender_id === currentUserId ? 90 : 50;
    const x = Math.max(10, Math.min(clientX, window.innerWidth - menuWidth - 15));
    const y = Math.max(10, Math.min(clientY, window.innerHeight - menuHeight - 15));
    setContextMenu({ message, x, y });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    let finalContent = content;
    if (replyingTo) {
      finalContent = JSON.stringify({
        _reply: {
          id: replyingTo.id,
          name: replyingTo.senderName,
          snippet: replyingTo.content.slice(0, 150),
        },
        text: content,
      });
      setReplyingTo(null);
    }

    try {
      await sendMessage(chat.id, currentUserId, finalContent);
    } catch (err) {
      console.error('Failed to send message:', err);
      setNewMessage(content); // Restore input on failure
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && replyingTo) {
      e.preventDefault();
      setReplyingTo(null);
      return;
    }
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
          {/* Mobile Back Button to return to Conversations Sidebar */}
          <button
            type="button"
            onClick={onBack}
            className="md:hidden flex items-center gap-1.5 py-1.5 px-3 -ml-1 text-[#171E2C] bg-[#F3F4F6] hover:bg-[#E5E7EB] active:scale-95 rounded-full transition-all cursor-pointer shrink-0 font-medium text-xs border border-[#E5E7EB] shadow-2xs"
            aria-label="Back to conversations"
            title="Back to conversations"
          >
            <span className="text-sm leading-none font-bold select-none">←</span>
            <span className="text-[12px] font-medium">Chats</span>
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
            className="w-8 h-8 flex items-center justify-center gap-[3px] text-[#8A909D] hover:text-[#171E2C] rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="More options"
          >
            <span className="w-1 h-1 rounded-full bg-current" />
            <span className="w-1 h-1 rounded-full bg-current" />
            <span className="w-1 h-1 rounded-full bg-current" />
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
                  className="block px-3 py-2 text-xs font-medium text-[#171E2C] hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  View Artwork
                </Link>
              )}
              {otherPerson?.id && (
                <Link
                  href={`/artist/${otherPerson.id}`}
                  className="block px-3 py-2 text-xs font-medium text-[#171E2C] hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  View Profile
                </Link>
              )}
              {otherPerson?.id && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setIsReportModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <span>Report Contact</span>
                  </button>
                </>
              )}
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
                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#8A8A85] uppercase tracking-wider bg-[#ECECE7]">
                    {artwork?.title ? artwork.title.substring(0, 2).toUpperCase() : 'ARTWORK'}
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

        {/* Chronological Messages with Swipe-to-Reply and Right-Click Context Menu */}
        {messages.map((message) => {
          const isMine = message.sender_id === currentUserId;

          return (
            <MessageBubbleItem
              key={message.id}
              message={message}
              isMine={isMine}
              contactName={contactName}
              otherPerson={otherPerson}
              avatarColor={avatarColor}
              formatMessageTime={formatMessageTime}
              onReply={handleInitiateReply}
              onOpenContextMenu={handleOpenContextMenu}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Context Menu (Right-Click on Desktop / Long-Press on Mobile) */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 9999,
            background: 'white',
            borderRadius: 14,
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
          }}
          className="p-1.5 min-w-[130px] border border-[#E8E8E3] animate-in fade-in zoom-in-95 duration-100 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Reply Option (Available on all messages) */}
          <button
            type="button"
            onClick={() => handleInitiateReply(contextMenu.message)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#141413] hover:bg-[#F5F5F7] rounded-lg transition-colors text-left cursor-pointer"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1345EE"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 17 4 12 9 7" />
              <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
            </svg>
            <span>Reply</span>
          </button>

          {/* Delete Option (Strictly restricted to own messages) */}
          {contextMenu.message.sender_id === currentUserId && (
            <button
              type="button"
              onClick={() => handleDeleteMessage(contextMenu.message.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span>Delete</span>
            </button>
          )}
        </div>
      )}

      {/* 3. BOTTOM INPUT CAPSULE: With Active Reply Banner and Send Button */}
      <div className="p-3.5 sm:p-5 pt-2 bg-transparent shrink-0">
        {/* Active Reply Banner (Rendered when Replying) */}
        {replyingTo && (
          <div className="mb-2 p-2.5 px-3.5 bg-white/95 backdrop-blur-md border border-[#E8E8E3] rounded-2xl flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-1 h-7 rounded-full bg-[#1345EE] shrink-0" />
              <div className="truncate text-xs">
                <div className="flex items-center gap-1.5">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1345EE"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 17 4 12 9 7" />
                    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                  </svg>
                  <span className="font-semibold text-[#141413]">
                    Replying to {replyingTo.senderName}
                  </span>
                </div>
                <p className="text-[#6E6E69] text-[11px] truncate mt-0.5 max-w-xs sm:max-w-md">
                  {replyingTo.content}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[#8A909D] hover:text-[#171E2C] hover:bg-gray-100 transition-colors cursor-pointer shrink-0 ml-2"
              title="Cancel reply"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <div
          style={{
            background: 'white',
            borderRadius: 40,
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          }}
          className="p-1.5 pl-5 sm:pl-6 flex items-center justify-between gap-3 border border-[#E8E8E3]"
        >
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={replyingTo ? `Reply to ${replyingTo.senderName}...` : 'Type Your Message'}
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
            className="px-6 py-2.5 text-xs sm:text-[13px] flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none shadow-md shrink-0 font-medium"
          >
            Send
          </button>
        </div>
      </div>

      {otherPerson?.id && (
        <ReportUserModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reportedUserId={otherPerson.id}
          reportedUserName={contactName}
        />
      )}
    </>
  );
}

// =========================================================================
// Interactive Message Bubble: Swipe-to-Reply on Mobile, Right-Click on Desktop
// =========================================================================
interface MessageBubbleItemProps {
  message: any;
  isMine: boolean;
  contactName: string;
  otherPerson: any;
  avatarColor: string;
  formatMessageTime: (dateStr: string) => string;
  onReply: (message: any) => void;
  onOpenContextMenu: (message: any, x: number, y: number) => void;
}

function MessageBubbleItem({
  message,
  isMine,
  contactName,
  otherPerson,
  avatarColor,
  formatMessageTime,
  onReply,
  onOpenContextMenu,
}: MessageBubbleItemProps) {
  const [dragX, setDragX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { reply, text } = parseMessageContent(message.content);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsSwiping(false);

    // Long press (500ms) to trigger context menu on mobile
    longPressTimerRef.current = setTimeout(() => {
      onOpenContextMenu(message, touch.clientX, touch.clientY);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    // Movement cancels long press
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    // Swipe right for reply (horizontal swipe dominates)
    if (dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      setIsSwiping(true);
      const damped = Math.min(dx * 0.45, 65);
      setDragX(damped);
    } else if (dx < 0 && isSwiping) {
      setDragX(0);
      setIsSwiping(false);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (dragX >= 35) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(25);
        } catch {}
      }
      onReply(message);
    }

    setDragX(0);
    setIsSwiping(false);
    touchStartRef.current = null;
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={`relative flex items-end gap-2.5 ${isMine ? 'justify-end' : 'justify-start'} group select-none`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpenContextMenu(message, e.clientX, e.clientY);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Swipe Right Indicator for Mobile */}
      {dragX > 5 && (
        <div
          className="absolute -left-7 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1345EE] text-white flex items-center justify-center shadow-xs pointer-events-none z-10 transition-opacity"
          style={{
            opacity: Math.min(dragX / 35, 1),
            transform: `translateY(-50%) scale(${Math.min(dragX / 35, 1)})`,
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 17 4 12 9 7" />
            <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
          </svg>
        </div>
      )}

      {/* Incoming Avatar */}
      {!isMine && (
        <div
          style={{
            background: otherPerson?.profile_pic_url ? '#E5E5E5' : avatarColor,
            borderRadius: 9999,
          }}
          className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-bold text-white shadow-2xs mb-1 select-none pointer-events-none"
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

      {/* Message Bubble Container with Transform for Swipe */}
      <div
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
        className="max-w-[80%] sm:max-w-[70%]"
      >
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
          className="px-4 py-3 shadow-2xs transition-shadow cursor-pointer relative"
        >
          {/* Quoted Reply Snippet */}
          {reply && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (reply.id) {
                  const targetEl = document.getElementById(`msg-${reply.id}`);
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetEl.classList.add('ring-2', 'ring-[#1345EE]', 'transition-all');
                    setTimeout(() => targetEl.classList.remove('ring-2', 'ring-[#1345EE]'), 1400);
                  }
                }
              }}
              className={`mb-2 p-2 rounded-lg text-[11px] cursor-pointer transition-opacity hover:opacity-90 ${
                isMine
                  ? 'bg-white/10 border-l-[3px] border-[#458CFF] text-white'
                  : 'bg-black/5 border-l-[3px] border-[#1345EE] text-[#101828]'
              }`}
            >
              <div className="flex items-center gap-1 font-semibold text-[10.5px] opacity-90 mb-0.5">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 17 4 12 9 7" />
                  <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                </svg>
                <span>{reply.name}</span>
              </div>
              <p className="line-clamp-1 opacity-75">{reply.snippet}</p>
            </div>
          )}

          {/* Main Message Text */}
          <p
            style={{
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              fontWeight: 400,
              color: isMine ? 'white' : '#101828',
            }}
            className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words"
          >
            {text}
          </p>

          {/* Timestamp */}
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
    </div>
  );
}

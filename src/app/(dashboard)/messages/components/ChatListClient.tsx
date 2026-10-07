'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, Check, Clock, Send } from 'lucide-react';
import { acceptChatRequest, sendMessage, rejectChatRequest } from '@/actions/chatActions';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

interface ChatListClientProps {
  initialChats: any[];
  currentUserId: string;
}

export default function ChatListClient({ initialChats, currentUserId }: ChatListClientProps) {
  const searchParams = useSearchParams();
  const initialChatId = searchParams?.get('chatId');

  const [activeTab, setActiveTab] = useState<'Requests' | 'Messages'>(initialChatId ? 'Messages' : 'Requests');
  const [chats, setChats] = useState(initialChats);
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);

  const pendingChats = chats.filter((c) => {
    if (c.status !== 'Pending') return false;
    const createdAt = new Date(c.created_at);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 5;
  });
  const activeChats = chats.filter((c) => c.status === 'Active');

  // Handle active tab change
  const handleTabChange = (tab: 'Requests' | 'Messages') => {
    setActiveTab(tab);
    if (tab === 'Messages' && activeChats.length > 0 && !selectedChatId) {
      setSelectedChatId(activeChats[0].id);
    }
  };

  const handleAccept = async (chatId: string) => {
    setLoadingIds((prev) => ({ ...prev, [chatId]: true }));
    try {
      await acceptChatRequest(chatId);
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, status: 'Active' } : c))
      );
      // Optional: switch to Messages tab after accept
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingIds((prev) => ({ ...prev, [chatId]: false }));
    }
  };

  const handleReject = async (chatId: string) => {
    setLoadingIds((prev) => ({ ...prev, [chatId]: true }));
    try {
      await rejectChatRequest(chatId);
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, status: 'Rejected' } : c))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingIds((prev) => ({ ...prev, [chatId]: false }));
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={() => handleTabChange('Requests')}
          className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${
            activeTab === 'Requests'
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Requests
        </button>
        <button
          onClick={() => handleTabChange('Messages')}
          className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${
            activeTab === 'Messages'
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Messages
        </button>
      </div>

      {activeTab === 'Requests' && (
        <>
          {pendingChats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pendingChats.map((chat: any) => {
                const isGuest = chat.guest_id === currentUserId;
                const otherPerson = isGuest ? chat.creator : chat.guest;
                const artwork = chat.artworks;
                const formattedDate = new Date(chat.created_at).toLocaleDateString('en-US', {
                  day: 'numeric', month: 'short', year: 'numeric',
                });

                return (
                  <div key={chat.id} className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
                    <div className="flex gap-5">
                      <div className="w-28 h-28 rounded-2xl bg-gray-100 flex-shrink-0 overflow-hidden">
                        {artwork?.image_url && <img src={artwork.image_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden text-xs font-bold text-gray-600 flex items-center justify-center">
                              {otherPerson?.profile_pic_url ? <img src={otherPerson.profile_pic_url} className="w-full h-full object-cover" /> : otherPerson?.full_name?.substring(0, 2).toUpperCase() || '?'}
                            </div>
                            <span className="text-sm font-bold text-gray-900">{otherPerson?.full_name}</span>
                          </div>
                          <span className="text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 uppercase">
                            Pending
                          </span>
                        </div>
                        <p className="text-[15px] font-extrabold text-gray-900 mb-2 truncate">
                          {isGuest ? 'Your interest in ' : 'Interest in '}{artwork?.title}
                        </p>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                          "I would love to learn more about this work and its availability."
                        </p>
                        <p className="text-[11px] font-medium text-gray-400 mb-4">{formattedDate}</p>

                        <div>
                          {isGuest ? (
                            <p className="text-xs font-medium text-gray-400">Waiting for creator response.</p>
                          ) : (
                            <div className="flex gap-2">
                              <Button onClick={() => handleAccept(chat.id)} isLoading={loadingIds[chat.id]} size="sm">
                                Accept Request
                              </Button>
                              <button 
                                onClick={() => handleReject(chat.id)} 
                                disabled={loadingIds[chat.id]} 
                                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-[24px] border border-gray-100 p-16 text-center">
              <MessageCircle size={24} className="text-gray-300 mx-auto mb-4" />
              <p className="font-bold text-gray-900 mb-1">No requests</p>
              <p className="text-sm text-gray-500">You don't have any pending requests.</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'Messages' && (
        <div className="flex h-[calc(100vh-280px)] min-h-[500px] bg-gray-50 rounded-[24px] overflow-hidden border border-gray-100 shadow-[0_4px_30px_rgb(0,0,0,0.03)]">
          {/* Sidebar */}
          <div className="w-[320px] bg-[#EFEFEF] border-r border-gray-200/50 flex flex-col flex-shrink-0">
            <div className="p-6">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                Conversations <span className="bg-white px-2 py-0.5 rounded-full text-xs font-semibold text-gray-500 shadow-sm">{activeChats.length}</span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {activeChats.length === 0 ? (
                <p className="text-xs text-gray-500 px-2">No active conversations.</p>
              ) : (
                activeChats.map((chat) => {
                  const isGuest = chat.guest_id === currentUserId;
                  const otherPerson = isGuest ? chat.creator : chat.guest;
                  const artwork = chat.artworks;
                  const isSelected = selectedChatId === chat.id;

                  return (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                        isSelected ? 'bg-[#E3E3E3] shadow-sm' : 'hover:bg-[#E3E3E3]/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 overflow-hidden">
                        {otherPerson?.profile_pic_url ? (
                          <img src={otherPerson.profile_pic_url} className="w-full h-full object-cover" />
                        ) : (
                          otherPerson?.full_name?.substring(0, 2).toUpperCase() || '?'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-gray-900 truncate">{otherPerson?.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{artwork?.title}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 bg-[#F5F5F5] flex flex-col relative">
            {selectedChatId ? (
              <ActiveChatPane 
                chatId={selectedChatId} 
                userId={currentUserId} 
                chatDetails={activeChats.find(c => c.id === selectedChatId)} 
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm font-medium">
                Select a conversation to start chatting.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function ActiveChatPane({ chatId, userId, chatDetails }: { chatId: string, userId: string, chatDetails: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  


  useEffect(() => {
    const supabase = createClient();
    
    // Fetch initial messages
    supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data || []));

    // Subscribe
    const channel = supabase.channel(`chat:${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    try {
      await sendMessage(chatId, userId, content);
    } catch {
      setNewMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!chatDetails) return null;

  const isGuest = chatDetails.guest_id === userId;
  const otherPerson = isGuest ? chatDetails.creator : chatDetails.guest;
  const artwork = chatDetails.artworks;

  return (
    <>
      <div className="h-20 bg-white border-b border-gray-200/50 flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 overflow-hidden">
            {otherPerson?.profile_pic_url ? <img src={otherPerson.profile_pic_url} className="w-full h-full object-cover" /> : otherPerson?.full_name?.substring(0,2).toUpperCase()}
          </div>
          <div>
            <h4 className="text-[15px] font-extrabold text-gray-900">{otherPerson?.full_name}</h4>
            <p className="text-xs text-gray-500 font-medium">{artwork?.title}</p>
          </div>
        </div>
        <Link href={`/artwork/${chatDetails.artwork_id}`} className="px-5 py-2.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
          View Artwork ↗
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-4">
        {messages.map((message) => {
          const isMine = message.sender_id === userId;
          return (
            <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-5 py-3.5 ${isMine ? 'bg-[#1A1A1A] text-white rounded-br-sm' : 'bg-[#EAEAEA] text-gray-900 rounded-bl-sm'}`}>
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={`text-[10px] mt-2 font-medium ${isMine ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-transparent">
        <p className="text-[10px] text-gray-400 font-medium mb-3 text-center">Local demo conversation - No payments or transactions on iRAS</p>
        <div className="bg-white rounded-full flex items-center p-2 shadow-sm border border-gray-200/50">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a thoughtful reply..."
            className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-gray-400 text-gray-900"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="px-6 py-2.5 bg-gray-500 text-white rounded-full text-sm font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            Send <span className="text-lg leading-none">→</span>
          </button>
        </div>
      </div>
    </>
  );
}

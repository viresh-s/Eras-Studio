import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ChatInterface from '@/components/features/chat/ChatInterface';

interface ChatPageProps {
  params: Promise<{ chatId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify user is participant
  const { data: chat } = await supabase
    .from('inquiries_chats')
    .select(`
      *,
      artworks(title, image_url),
      guest:profiles!inquiries_chats_guest_id_fkey(full_name, profile_pic_url),
      creator:profiles!inquiries_chats_creator_id_fkey(full_name, profile_pic_url)
    `)
    .eq('id', chatId)
    .single();

  if (!chat) notFound();
  if (chat.guest_id !== user.id && chat.creator_id !== user.id) notFound();

  // Fetch existing messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*, profiles(full_name, profile_pic_url)')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  const isGuest = chat.guest_id === user.id;
  const otherPerson = isGuest ? chat.creator : chat.guest;

  return (
    <ChatInterface
      chatId={chatId}
      userId={user.id}
      otherPerson={otherPerson as { full_name: string; profile_pic_url: string | null }}
      artwork={chat.artworks as { title: string; image_url: string }}
      initialMessages={messages || []}
    />
  );
}

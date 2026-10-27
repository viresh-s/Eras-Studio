import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import ChatListClient from './components/ChatListClient';

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: chats } = await supabase
    .from('inquiries_chats')
    .select(`
      *,
      artworks(id, title, image_url),
      guest:profiles!inquiries_chats_guest_id_fkey(id, full_name, profile_pic_url),
      creator:profiles!inquiries_chats_creator_id_fkey(id, full_name, profile_pic_url)
    `)
    .or(`guest_id.eq.${user.id},creator_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  return (
    <div className="py-4">
      <Suspense fallback={<div className="h-96 flex items-center justify-center text-gray-400 font-sans">Loading your inbox...</div>}>
        <ChatListClient initialChats={chats || []} currentUserId={user.id} />
      </Suspense>
    </div>
  );
}

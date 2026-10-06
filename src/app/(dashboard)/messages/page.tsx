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
      artworks(title, image_url),
      guest:profiles!inquiries_chats_guest_id_fkey(full_name, profile_pic_url),
      creator:profiles!inquiries_chats_creator_id_fkey(full_name, profile_pic_url)
    `)
    .or(`guest_id.eq.${user.id},creator_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase mb-2">
          Open to iRAS Start with a conversation instead
        </p>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-1">Your inbox</h1>
        <p className="text-gray-500 text-sm">Interest first. A meaningful conversation next.</p>
      </div>

      <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-400">Loading inbox...</div>}>
        <ChatListClient initialChats={chats || []} currentUserId={user.id} />
      </Suspense>
    </div>
  );
}

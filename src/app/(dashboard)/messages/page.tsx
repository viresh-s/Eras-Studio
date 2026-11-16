import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import ChatListClient from './components/ChatListClient';
import { ChatListSkeleton } from '@/components/ui/Skeleton';

export default async function MessagesPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
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
      <Suspense fallback={<ChatListSkeleton />}>
        <ChatListClient initialChats={chats || []} currentUserId={user.id} />
      </Suspense>
    </div>
  );
}

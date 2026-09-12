import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

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
      <h1 className="font-heading text-3xl font-bold mb-6">Messages</h1>

      {chats && chats.length > 0 ? (
        <div className="space-y-3">
          {chats.map((chat: Record<string, unknown>) => {
            const isGuest = (chat.guest_id as string) === user.id;
            const otherPerson = isGuest
              ? (chat.creator as Record<string, string>)
              : (chat.guest as Record<string, string>);

            return (
              <Link key={chat.id as string} href={`/messages/${chat.id}`}>
                <Card className="flex items-center gap-4 cursor-pointer hover:bg-brand-lightgray transition-colors">
                  {/* Artwork thumbnail */}
                  <div className="w-14 h-14 border-2 border-brand-black flex-shrink-0 overflow-hidden bg-brand-lightgray">
                    {(chat.artworks as Record<string, string>)?.image_url && (
                      <img
                        src={(chat.artworks as Record<string, string>).image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold truncate">
                      {(chat.artworks as Record<string, string>)?.title}
                    </p>
                    <p className="text-brand-gray text-sm truncate">
                      with {otherPerson?.full_name}
                    </p>
                  </div>

                  {/* Status */}
                  <Badge variant={(chat.status as string) === 'Active' ? 'blue' : 'gray'}>
                    {chat.status as string}
                  </Badge>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <MessageCircle size={48} className="mx-auto mb-3 text-brand-gray" />
            <p className="font-heading text-xl font-bold mb-2">No messages yet</p>
            <p className="text-brand-gray">Start a conversation by expressing interest in an artwork</p>
          </div>
        </Card>
      )}
    </div>
  );
}

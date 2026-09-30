import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
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
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase mb-2">
          Open to iRAS Start with a conversation instead
        </p>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-1">Your inbox</h1>
        <p className="text-gray-500 text-sm">Interest first. A meaningful conversation next.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8">
        <button className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-full">
          Requests
        </button>
        <button className="px-5 py-2 bg-white text-gray-500 text-sm font-medium rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
          Messages
        </button>
      </div>

      {chats && chats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {chats.map((chat: Record<string, unknown>) => {
            const isGuest = (chat.guest_id as string) === user.id;
            const otherPerson = isGuest
              ? (chat.creator as Record<string, string>)
              : (chat.guest as Record<string, string>);
            const artwork = chat.artworks as Record<string, string>;
            const date = new Date(chat.created_at as string);
            const formattedDate = date.toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={chat.id as string}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Artwork thumbnail */}
                  <div className="w-28 h-28 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {artwork?.image_url && (
                      <img
                        src={artwork.image_url}
                        alt={artwork.title || ''}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Sender info + status */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden flex-shrink-0">
                          {otherPerson?.profile_pic_url ? (
                            <img src={otherPerson.profile_pic_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            otherPerson?.full_name?.substring(0, 2).toUpperCase() || '?'
                          )}
                        </div>
                        <span className="text-sm font-bold text-gray-900">{otherPerson?.full_name}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                        (chat.status as string) === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {chat.status as string}
                      </span>
                    </div>

                    {/* Inquiry message */}
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Interested in {artwork?.title}
                    </p>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                      &ldquo;I would love to learn more about this work and its availability.&rdquo;
                    </p>

                    {/* Date */}
                    <p className="text-[11px] text-gray-400 mb-3">{formattedDate}</p>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/messages/${chat.id}`}
                        className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-full hover:bg-gray-800 transition-colors"
                      >
                        Start Conversation
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={24} className="text-gray-400" />
          </div>
          <p className="font-bold text-gray-900 text-lg mb-2">No messages yet</p>
          <p className="text-gray-500 text-sm">Start a conversation by expressing interest in an artwork</p>
        </div>
      )}
    </div>
  );
}

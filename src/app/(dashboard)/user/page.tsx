import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { Search, MessageCircle } from 'lucide-react';

export default async function UserDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Active chats
  const { data: chats, count: chatCount } = await supabase
    .from('inquiries_chats')
    .select(`
      *,
      artworks(title, image_url, price),
      creator:profiles!inquiries_chats_creator_id_fkey(full_name)
    `, { count: 'exact' })
    .eq('guest_id', user.id)
    .eq('status', 'Active')
    .order('created_at', { ascending: false })
    .limit(5);

  // Recent artworks (for "Recently browsed" placeholder)
  const { data: recentArtworks } = await supabase
    .from('artworks')
    .select(`*, profiles(full_name)`)
    .eq('status', 'Available')
    .order('created_at', { ascending: false })
    .limit(6);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Collector Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <MessageCircle size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium">Active Conversations</p>
              <p className="text-xl font-extrabold text-gray-900">{chatCount || 0}</p>
            </div>
          </div>
        </div>

        <Link href="/discovery">
          <div className="bg-white rounded-2xl p-5 shadow-[0_2px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-pink-50 flex items-center justify-center">
                <Search size={20} className="text-pink-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Browse Artworks</p>
                <p className="text-gray-500 text-xs">Discover new pieces →</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Active Conversations */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Active Conversations</h2>
        {chats && chats.length > 0 ? (
          <div className="space-y-2">
            {chats.map((chat: Record<string, unknown>) => (
              <Link key={chat.id as string} href={`/messages/${chat.id}`}>
                <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-[0_2px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgb(0,0,0,0.06)] transition-shadow cursor-pointer">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                    {(chat.artworks as Record<string, string>)?.image_url && (
                      <img
                        src={(chat.artworks as Record<string, string>).image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {(chat.artworks as Record<string, string>)?.title}
                    </p>
                    <p className="text-gray-500 text-sm">
                      with {(chat.creator as Record<string, string>)?.full_name}
                    </p>
                  </div>
                  <Badge variant="blue">Active</Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <MessageCircle size={18} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm mb-4">No active conversations</p>
            <Link href="/discovery" className="inline-flex items-center px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-all">
              Browse Artworks
            </Link>
          </div>
        )}
      </div>

      {/* Discover */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Discover Artworks</h2>
          <Link href="/discovery" className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            View All
          </Link>
        </div>
        {recentArtworks && recentArtworks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentArtworks.map((artwork) => (
              <Link key={artwork.id} href={`/artwork/${artwork.id}`}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow cursor-pointer">
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 truncate">{artwork.title}</h3>
                    <p className="text-gray-500 text-sm">{(artwork.profiles as Record<string, string>)?.full_name}</p>
                    {artwork.price && (
                      <p className="font-bold text-gray-900 mt-1">${artwork.price}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-8 text-center">
            <p className="text-gray-500 text-sm">No artworks available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

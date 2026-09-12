import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
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
      <h1 className="font-heading text-3xl font-bold mb-6">Collector Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 border-3 border-brand-black bg-brand-blue text-white">
              <MessageCircle size={24} />
            </div>
            <div>
              <p className="text-brand-gray text-sm font-medium">Active Conversations</p>
              <p className="font-heading text-2xl font-bold">{chatCount || 0}</p>
            </div>
          </div>
        </Card>

        <Link href="/browse">
          <Card className="cursor-pointer hover:bg-brand-yellow transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-3 border-3 border-brand-black bg-brand-pink">
                <Search size={24} />
              </div>
              <div>
                <p className="font-heading font-bold text-lg">Browse Artworks</p>
                <p className="text-brand-gray text-sm">Discover new pieces →</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Active Conversations */}
      <div className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-4">Active Conversations</h2>
        {chats && chats.length > 0 ? (
          <div className="space-y-3">
            {chats.map((chat: Record<string, unknown>) => (
              <Link key={chat.id as string} href={`/messages/${chat.id}`}>
                <Card className="flex items-center gap-4 cursor-pointer hover:bg-brand-lightgray">
                  <div className="w-14 h-14 border-2 border-brand-black flex-shrink-0 overflow-hidden bg-brand-lightgray">
                    {(chat.artworks as Record<string, string>)?.image_url && (
                      <img
                        src={(chat.artworks as Record<string, string>).image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold truncate">
                      {(chat.artworks as Record<string, string>)?.title}
                    </p>
                    <p className="text-brand-gray text-sm">
                      with {(chat.creator as Record<string, string>)?.full_name}
                    </p>
                  </div>
                  <Badge variant="blue">Active</Badge>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-6">
              <MessageCircle size={36} className="mx-auto mb-2 text-brand-gray" />
              <p className="text-brand-gray mb-3">No active conversations</p>
              <Link href="/browse" className="btn-brutal btn-brutal-sm">
                Browse Artworks
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Discover */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold">Discover Artworks</h2>
          <Link href="/browse" className="btn-brutal btn-brutal-sm btn-brutal-blue">
            View All
          </Link>
        </div>
        {recentArtworks && recentArtworks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentArtworks.map((artwork) => (
              <Link key={artwork.id} href={`/artwork/${artwork.id}`}>
                <Card padding="none" className="cursor-pointer">
                  <div className="aspect-[4/3] bg-brand-lightgray border-b-3 border-brand-black overflow-hidden">
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading font-bold truncate">{artwork.title}</h3>
                    <p className="text-brand-gray text-sm">{(artwork.profiles as Record<string, string>)?.full_name}</p>
                    {artwork.price && (
                      <p className="font-heading font-bold mt-1">${artwork.price}</p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-6">
              <p className="text-brand-gray">No artworks available yet</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

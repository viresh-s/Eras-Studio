import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Image, MessageCircle, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function CreatorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch stats
  const { count: artworkCount } = await supabase
    .from('artworks')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', user.id);

  const { count: chatCount } = await supabase
    .from('inquiries_chats')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', user.id)
    .eq('status', 'Active');

  const { data: recentArtworks } = await supabase
    .from('artworks')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6);

  const { data: recentChats } = await supabase
    .from('inquiries_chats')
    .select(`
      *,
      artworks(title, image_url),
      guest:profiles!inquiries_chats_guest_id_fkey(full_name)
    `)
    .eq('creator_id', user.id)
    .eq('status', 'Active')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-6">Creator Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 border-3 border-brand-black bg-brand-yellow">
              <Image size={24} />
            </div>
            <div>
              <p className="text-brand-gray text-sm font-medium">Total Artworks</p>
              <p className="font-heading text-2xl font-bold">{artworkCount || 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 border-3 border-brand-black bg-brand-pink">
              <MessageCircle size={24} />
            </div>
            <div>
              <p className="text-brand-gray text-sm font-medium">Active Chats</p>
              <p className="font-heading text-2xl font-bold">{chatCount || 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 border-3 border-brand-black bg-brand-blue text-white">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-brand-gray text-sm font-medium">Available</p>
              <p className="font-heading text-2xl font-bold">
                {recentArtworks?.filter(a => a.status === 'Available').length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 border-3 border-brand-black bg-brand-green">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-brand-gray text-sm font-medium">Sold</p>
              <p className="font-heading text-2xl font-bold">
                {recentArtworks?.filter(a => a.status === 'Sold').length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Artworks */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold">Recent Uploads</h2>
          <Link href="/creator/artworks" className="btn-brutal btn-brutal-sm">
            View All
          </Link>
        </div>

        {recentArtworks && recentArtworks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentArtworks.map((artwork) => (
              <Card key={artwork.id} padding="none">
                <div className="aspect-[4/3] bg-brand-lightgray border-b-3 border-brand-black overflow-hidden">
                  {artwork.image_url && (
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-bold text-lg truncate">{artwork.title}</h3>
                  <p className="text-brand-gray text-sm">{artwork.art_type}</p>
                  <div className="flex items-center justify-between mt-2">
                    {artwork.price && (
                      <span className="font-heading font-bold">${artwork.price}</span>
                    )}
                    <Badge variant={artwork.status === 'Available' ? 'green' : 'red'}>
                      {artwork.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-8">
              <Image size={48} className="mx-auto mb-3 text-brand-gray" />
              <p className="font-heading font-bold text-lg mb-2">No artworks yet</p>
              <p className="text-brand-gray mb-4">Start showcasing your work to the world</p>
              <Link href="/creator/upload" className="btn-brutal">
                Upload Your First Artwork
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Active Inquiries */}
      <div>
        <h2 className="font-heading text-xl font-bold mb-4">Active Inquiries</h2>
        {recentChats && recentChats.length > 0 ? (
          <div className="space-y-3">
            {recentChats.map((chat: Record<string, unknown>) => (
              <Link key={chat.id as string} href={`/messages/${chat.id}`}>
                <Card className="flex items-center gap-4 hover:bg-brand-lightgray cursor-pointer">
                  <div className="w-12 h-12 border-2 border-brand-black bg-brand-yellow flex-shrink-0 overflow-hidden">
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
                    <p className="text-brand-gray text-sm truncate">
                      from {(chat.guest as Record<string, string>)?.full_name}
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
              <p className="text-brand-gray">No active inquiries yet</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

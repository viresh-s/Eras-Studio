import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Users, Image, MessageCircle, Shield, TrendingUp } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'Admin') redirect('/');

  // Stats
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'User');

  const { count: totalCreators } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'Creator');

  const { count: totalArtworks } = await supabase
    .from('artworks')
    .select('*', { count: 'exact', head: true });

  const { count: activeChats } = await supabase
    .from('inquiries_chats')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active');

  const { count: premiumCreators } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'Creator')
    .eq('is_premium', true);

  // Recent users
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  // Recent artworks
  const { data: recentArtworks } = await supabase
    .from('artworks')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 border-3 border-brand-black bg-brand-yellow">
          <Shield size={24} />
        </div>
        <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-brand-black bg-brand-blue text-white">
              <Users size={20} />
            </div>
            <div>
              <p className="text-brand-gray text-xs font-medium">Collectors</p>
              <p className="font-heading text-xl font-bold">{totalUsers || 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-brand-black bg-brand-pink">
              <Users size={20} />
            </div>
            <div>
              <p className="text-brand-gray text-xs font-medium">Creators</p>
              <p className="font-heading text-xl font-bold">{totalCreators || 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-brand-black bg-brand-yellow">
              <Image size={20} />
            </div>
            <div>
              <p className="text-brand-gray text-xs font-medium">Artworks</p>
              <p className="font-heading text-xl font-bold">{totalArtworks || 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-brand-black bg-brand-green">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="text-brand-gray text-xs font-medium">Active Chats</p>
              <p className="font-heading text-xl font-bold">{activeChats || 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-brand-black bg-brand-yellow">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-brand-gray text-xs font-medium">Premium</p>
              <p className="font-heading text-xl font-bold">{premiumCreators || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-heading text-xl font-bold mb-4">Recent Users</h2>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-3 border-brand-black bg-brand-offwhite">
                    <th className="text-left px-4 py-3 font-heading text-sm uppercase">Name</th>
                    <th className="text-left px-4 py-3 font-heading text-sm uppercase">Role</th>
                    <th className="text-left px-4 py-3 font-heading text-sm uppercase">Premium</th>
                    <th className="text-left px-4 py-3 font-heading text-sm uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers?.map((u) => (
                    <tr key={u.id} className="border-b border-brand-lightgray hover:bg-brand-lightgray">
                      <td className="px-4 py-3 text-sm font-medium">{u.full_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === 'Creator' ? 'pink' : u.role === 'Admin' ? 'yellow' : 'blue'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_premium ? (
                          <Badge variant="green">Yes</Badge>
                        ) : (
                          <Badge variant="gray">No</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-gray">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold mb-4">Recent Artworks</h2>
          <div className="space-y-3">
            {recentArtworks?.map((artwork) => (
              <Card key={artwork.id} className="flex items-center gap-4">
                <div className="w-14 h-14 border-2 border-brand-black bg-brand-lightgray flex-shrink-0 overflow-hidden">
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold truncate">{artwork.title}</p>
                  <p className="text-brand-gray text-sm">
                    by {(artwork.profiles as Record<string, string>)?.full_name}
                  </p>
                </div>
                <Badge variant={artwork.status === 'Available' ? 'green' : 'red'}>
                  {artwork.status}
                </Badge>
              </Card>
            ))}
            {(!recentArtworks || recentArtworks.length === 0) && (
              <Card>
                <p className="text-center text-brand-gray py-4">No artworks yet</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

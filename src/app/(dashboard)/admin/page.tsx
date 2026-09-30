import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
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
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <Shield size={20} className="text-amber-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Admin Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium">Collectors</p>
              <p className="text-lg font-extrabold text-gray-900">{totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
              <Users size={18} className="text-pink-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium">Creators</p>
              <p className="text-lg font-extrabold text-gray-900">{totalCreators || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Image size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium">Artworks</p>
              <p className="text-lg font-extrabold text-gray-900">{totalArtworks || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <MessageCircle size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium">Active Chats</p>
              <p className="text-lg font-extrabold text-gray-900">{activeChats || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium">Premium</p>
              <p className="text-lg font-extrabold text-gray-900">{premiumCreators || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users & Artworks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Users</h2>
          <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Premium</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers?.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.full_name}</td>
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
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Artworks</h2>
          <div className="space-y-2">
            {recentArtworks?.map((artwork) => (
              <div key={artwork.id} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{artwork.title}</p>
                  <p className="text-gray-500 text-sm">
                    by {(artwork.profiles as Record<string, string>)?.full_name}
                  </p>
                </div>
                <Badge variant={artwork.status === 'Available' ? 'green' : 'red'}>
                  {artwork.status}
                </Badge>
              </div>
            ))}
            {(!recentArtworks || recentArtworks.length === 0) && (
              <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-8 text-center">
                <p className="text-gray-500 text-sm">No artworks yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

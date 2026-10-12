import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Image } from 'lucide-react';
import ArtworkGridCard from '@/components/features/creator/ArtworkGridCard';
import ArtworkCardActions from '@/components/features/creator/ArtworkCardActions';

export default async function CreatorArtworksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: artworks } = await supabase
    .from('artworks')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase mb-2">
            Portfolio Management
          </p>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-1">My Artworks</h1>
          <p className="text-gray-500 text-sm">{artworks?.length || 0} pieces in your portfolio</p>
        </div>
        <Link
          href="/portfolio/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-all"
        >
          <Plus size={16} />
          Add Artwork
        </Link>
      </div>

      {artworks && artworks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {artworks.map((artwork) => (
            <ArtworkGridCard key={artwork.id} artwork={artwork} creatorName={profile?.full_name}>
              <ArtworkCardActions artwork={artwork} userId={user.id} />
            </ArtworkGridCard>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Image size={24} className="text-gray-400" />
          </div>
          <p className="font-bold text-gray-900 text-lg mb-2">No artworks yet</p>
          <p className="text-gray-500 text-sm mb-6">Upload your first artwork to get started</p>
          <Link
            href="/portfolio/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-all"
          >
            <Plus size={16} /> Upload Artwork
          </Link>
        </div>
      )}
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, Eye } from 'lucide-react';
import ArtworkGridCard from '@/components/features/creator/ArtworkGridCard';

export const dynamic = 'force-dynamic';

export default async function SavedArtworksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch saved artworks with details
  const { data: savedItems } = await supabase
    .from('saved_artworks')
    .select(`
      artwork_id,
      artworks (
        *,
        profiles!artworks_creator_id_fkey (full_name)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const artworks = savedItems?.map(item => item.artworks).filter(Boolean) || [];

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase mb-2">
          Your Collection
        </p>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-1">Saved Artworks</h1>
        <p className="text-gray-500 text-sm">Pieces you've kept an eye on.</p>
      </div>

      {artworks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {artworks.map((artwork: any) => (
            <ArtworkGridCard 
              key={artwork.id} 
              artwork={artwork} 
              creatorName={artwork.profiles?.full_name} 
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center max-w-2xl mx-auto mt-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Bookmark size={24} className="text-gray-400" />
          </div>
          <p className="font-bold text-gray-900 text-lg mb-2">No saved artworks</p>
          <p className="text-gray-500 text-sm mb-6">Explore the gallery and save artworks you love to find them here later.</p>
          <Link
            href="/discovery"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm"
          >
            <Eye size={16} />
            Explore Gallery
          </Link>
        </div>
      )}
    </div>
  );
}

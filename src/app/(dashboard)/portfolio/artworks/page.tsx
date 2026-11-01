import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import ArtworkGridCard from '@/components/features/creator/ArtworkGridCard';
import ArtworkCardActions from '@/components/features/creator/ArtworkCardActions';

export default async function CreatorArtworksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: artworks },
    { data: profile }
  ] = await Promise.all([
    supabase
      .from('artworks')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 tracking-tight">My Artworks</h1>
        </div>
        <Link
          href="/portfolio/upload"
          style={{
            position: 'relative',
            background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
            boxShadow:
              '0px 7px 22px rgba(35, 77, 255, 0.13), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
            overflow: 'hidden',
            borderRadius: 40,
            outline: '2px #2356FF solid',
            outlineOffset: '-2px',
          }}
          className="px-8 py-3.5 sm:px-10 sm:py-4 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98] group select-none shadow-md"
        >
          <div
            style={{
              position: 'absolute',
              inset: 3,
              borderRadius: 37,
              border: '1px rgba(255, 255, 255, 0.15) solid',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              color: 'white',
              fontSize: 15,
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              fontWeight: '600',
              lineHeight: '24px',
            }}
            className="flex items-center gap-2 relative z-10"
          >
            <Plus size={18} className="text-white" />
            <span>Add Artwork</span>
          </div>
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
        <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center">
          <p className="font-serif font-bold text-gray-900 text-xl mb-6">No artworks yet</p>
          <Link
            href="/portfolio/upload"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-black transition-all"
          >
            <Plus size={16} /> Add Artwork
          </Link>
        </div>
      )}
    </div>
  );
}

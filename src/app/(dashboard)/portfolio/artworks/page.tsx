import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ArtworkGridCard from '@/components/features/creator/ArtworkGridCard';
import ArtworkCardActions from '@/components/features/creator/ArtworkCardActions';
import RestrictedUploadAction from '../components/RestrictedUploadAction';
import { evaluateFreemiumStatus } from '@/lib/freemium/check';

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
      .select('full_name, plan, is_premium')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  const freemiumStatus = evaluateFreemiumStatus(profile, artworks?.length || 0);
  const isLimited = freemiumStatus.isLocked;

  return (
    <div style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-4xl font-serif italic font-semibold text-gray-900 tracking-tight"
            style={{ fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif", fontStyle: 'italic' }}
          >
            My Artworks
          </h1>
        </div>
        <RestrictedUploadAction
          isLimited={isLimited}
          label="Add Artwork"
          variant="gradient"
        />
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
          <p
            className="font-serif italic font-normal text-gray-900 text-xl mb-6"
            style={{ fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif", fontStyle: 'italic' }}
          >
            No artworks yet
          </p>
          <RestrictedUploadAction
            isLimited={isLimited}
            label="Add Artwork"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-normal hover:bg-black transition-all"
          />
        </div>
      )}
    </div>
  );
}

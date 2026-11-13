import { redirect } from 'next/navigation';
import { createClient, getAuthenticatedProfile } from '@/lib/supabase/server';
import { getCreatorCollections } from '@/actions/collectionActions';
import ArtworkUploadForm from '@/components/features/creator/ArtworkUploadForm';

export const dynamic = 'force-dynamic';

export default async function EditArtworkPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [artworkRes, profile, collections] = await Promise.all([
    supabase
      .from('artworks')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('creator_id', user.id)
      .single(),
    getAuthenticatedProfile(user.id),
    getCreatorCollections(user.id),
  ]);

  const artwork = artworkRes.data;

  if (!artwork) {
    redirect('/portfolio');
  }

  return (
    <ArtworkUploadForm
      userId={user.id}
      profile={profile}
      collections={collections || []}
      initialArtwork={artwork}
    />
  );
}

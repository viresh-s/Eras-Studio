import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCreatorCollections } from '@/actions/collectionActions';
import CollectionManager from '@/components/collections/CollectionManager';

export const dynamic = 'force-dynamic';

export default async function CollectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [collections, { data: artworks }] = await Promise.all([
    getCreatorCollections(user.id),
    supabase
      .from('artworks')
      .select('id, title, image_url, collection, collection_id, year, price, art_type, status, is_published')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <CollectionManager
      initialCollections={collections}
      initialArtworks={artworks || []}
      userId={user.id}
    />
  );
}

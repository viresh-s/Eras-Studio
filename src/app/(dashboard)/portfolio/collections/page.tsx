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

  const collections = await getCreatorCollections(user.id);

  return <CollectionManager initialCollections={collections} userId={user.id} />;
}


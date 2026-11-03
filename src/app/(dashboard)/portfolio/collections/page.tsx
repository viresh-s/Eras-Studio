import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCreatorCollections } from '@/actions/collectionActions';
import CollectionManager from '@/components/collections/CollectionManager';

export default async function CollectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const collections = await getCreatorCollections(user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <CollectionManager initialCollections={collections} userId={user.id} />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { createClient, getAuthenticatedProfile } from '@/lib/supabase/server';
import { checkFreemiumStatus } from '@/lib/freemium/check';
import { getCreatorCollections } from '@/actions/collectionActions';
import ArtworkUploadForm from '@/components/features/creator/ArtworkUploadForm';

export const dynamic = 'force-dynamic';

export default async function UploadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [freemiumStatus, profile, collections] = await Promise.all([
    checkFreemiumStatus(user.id),
    getAuthenticatedProfile(user.id),
    getCreatorCollections(user.id),
  ]);

  if (freemiumStatus.isLocked) {
    redirect('/subscription');
  }

  return (
    <ArtworkUploadForm
      userId={user.id}
      profile={profile}
      collections={collections || []}
      freemiumStatus={freemiumStatus}
    />
  );
}

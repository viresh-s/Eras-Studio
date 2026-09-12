import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkFreemiumStatus } from '@/lib/freemium/check';
import ArtworkUploadForm from '@/components/features/creator/ArtworkUploadForm';
import UpgradePrompt from '@/components/features/creator/UpgradePrompt';

export default async function UploadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const freemiumStatus = await checkFreemiumStatus(user.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-6">Upload Artwork</h1>

      {freemiumStatus.isLocked ? (
        <UpgradePrompt userId={user.id} freemiumStatus={freemiumStatus} />
      ) : (
        <ArtworkUploadForm userId={user.id} freemiumStatus={freemiumStatus} />
      )}
    </div>
  );
}

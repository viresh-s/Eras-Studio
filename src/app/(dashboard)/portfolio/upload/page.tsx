import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkFreemiumStatus } from '@/lib/freemium/check';
import ArtworkUploadForm from '@/components/features/creator/ArtworkUploadForm';

export default async function UploadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const freemiumStatus = await checkFreemiumStatus(user.id);
  if (freemiumStatus.isLocked) {
    redirect('/subscription');
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-6">Upload Artwork</h1>

      <ArtworkUploadForm userId={user.id} freemiumStatus={freemiumStatus} />
    </div>
  );
}

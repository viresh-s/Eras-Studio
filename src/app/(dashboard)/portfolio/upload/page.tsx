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
    <div style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>
      <h1
        className="text-3xl sm:text-4xl font-serif italic font-normal text-[#141413] tracking-tight mb-6"
        style={{
          fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
          fontStyle: 'italic',
          fontWeight: 400,
        }}
      >
        Upload your artwork
      </h1>

      <ArtworkUploadForm userId={user.id} freemiumStatus={freemiumStatus} />
    </div>
  );
}

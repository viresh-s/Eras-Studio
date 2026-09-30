import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ArtworkEditForm from '@/components/features/creator/ArtworkEditForm';

export default async function EditArtworkPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Await params if it's a promise (Next.js 15+ compatibility)
  const resolvedParams = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: artwork } = await supabase
    .from('artworks')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('creator_id', user.id)
    .single();

  if (!artwork) {
    redirect('/portfolio/artworks'); // If it doesn't exist or doesn't belong to the user
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-6">Manage Artwork</h1>
      <ArtworkEditForm userId={user.id} artwork={artwork} />
    </div>
  );
}

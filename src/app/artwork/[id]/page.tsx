import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ArtworkDiscoveryDetail from '@/components/features/artwork/ArtworkDiscoveryDetail';

interface ArtworkPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: artwork } = await supabase
    .from('artworks')
    .select(`*, profiles(full_name, profile_pic_url, about_me, portfolio_url)`)
    .eq('id', id)
    .single();

  if (!artwork) notFound();

  let userRole: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    userRole = profile?.role || null;
  }

  const isOwner = user?.id === artwork.creator_id;
  const canExpress = Boolean(user && !isOwner);

  let existingChat = null;
  let isSaved = false;

  if (canExpress && user) {
    const { data: chatData } = await supabase
      .from('inquiries_chats')
      .select('id, status, created_at')
      .eq('artwork_id', id)
      .eq('guest_id', user.id)
      .maybeSingle();

    existingChat = chatData;

    // Check if artwork is saved (ignore errors if table missing)
    const { data: savedData } = await supabase
      .from('saved_artworks')
      .select('id')
      .eq('artwork_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    isSaved = !!savedData;
  }

  return (
    <ArtworkDiscoveryDetail
      artwork={artwork}
      currentUser={user ? { id: user.id } : null}
      userRole={userRole}
      existingChat={existingChat}
      isSaved={isSaved}
    />
  );
}

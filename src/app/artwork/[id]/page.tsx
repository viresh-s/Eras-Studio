import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ArtworkDiscoveryDetail from '@/components/features/artwork/ArtworkDiscoveryDetail';

interface ArtworkPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Concurrently fetch auth user and artwork data
  const [
    { data: { user } },
    { data: artwork }
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('artworks')
      .select(`*, profiles(full_name, profile_pic_url, about_me, portfolio_url)`)
      .eq('id', id)
      .maybeSingle(),
  ]);

  if (!user) {
    redirect('/login');
  }

  if (!artwork) notFound();

  const isOwner = user.id === artwork.creator_id;
  const canExpress = !isOwner;

  // 2. Concurrently fetch user profile, existing chat, and save status in parallel
  const [
    { data: profile },
    chatResult,
    savedResult
  ] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    canExpress
      ? supabase
          .from('inquiries_chats')
          .select('id, status, created_at')
          .eq('artwork_id', id)
          .eq('guest_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    canExpress
      ? supabase
          .from('saved_artworks')
          .select('id')
          .eq('artwork_id', id)
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const userRole = profile?.role || null;
  const existingChat = chatResult?.data || null;
  const isSaved = Boolean(savedResult?.data);

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

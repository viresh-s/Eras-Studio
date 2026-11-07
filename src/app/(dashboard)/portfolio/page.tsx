import { createClient, getAuthenticatedUser, getAuthenticatedProfile } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCreatorCollections } from '@/actions/collectionActions';
import { evaluateFreemiumStatus } from '@/lib/freemium/check';
import PortfolioClient from '@/components/features/creator/PortfolioClient';

export const dynamic = 'force-dynamic';

export default async function CreatorDashboard() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  // Fetch profile via request cache (shared with DashboardLayout) and remaining counts in parallel
  const [
    profile,
    { count: artworkCount },
    { count: chatCount },
    { data: artworks },
    collections,
  ] = await Promise.all([
    getAuthenticatedProfile(user.id),
    supabase.from('artworks').select('*', { count: 'exact', head: true }).eq('creator_id', user.id),
    supabase.from('inquiries_chats').select('*', { count: 'exact', head: true }).eq('creator_id', user.id),
    supabase
      .from('artworks')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false }),
    getCreatorCollections(user.id),
  ]);

  const freemiumStatus = evaluateFreemiumStatus(profile, artworkCount || 0);

  // Calculate profile completeness matching EditProfileForm dossier fields
  const profileFields = [
    Boolean(profile?.full_name),
    Boolean(profile?.profile_pic_url),
    Boolean(profile?.location_city || profile?.location_country),
    Boolean(profile?.primary_medium),
    Boolean(profile?.about_me || profile?.artist_statement),
    Boolean(profile?.artist_bio_file_url),
    Boolean(profile?.cv_file_url),
    Boolean(profile?.artist_statement_file_url),
    Boolean(profile?.short_portfolio_file_url),
    Boolean(profile?.long_portfolio_file_url || profile?.portfolio_url),
    Boolean(profile?.top_artworks_drive_url),
  ];
  const filledFields = profileFields.filter(Boolean).length;
  const completeness = Math.round((filledFields / profileFields.length) * 100);

  const isLimited = freemiumStatus.isLocked;

  return (
    <PortfolioClient
      initialArtworks={artworks || []}
      profile={profile}
      collectionsCount={collections?.length || 0}
      chatCount={chatCount || 0}
      artworkCount={artworkCount || 0}
      completeness={completeness}
      isLimited={isLimited}
      userId={user.id}
    />
  );
}

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

  // Aggregate real-time likes & views across all creator artworks
  const artworkIds = (artworks || []).map((a) => a.id);

  const [profileViewsRes, savedArtworksRes, artworkViewsRes] = await Promise.all([
    (supabase as any)
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id),
    artworkIds.length > 0
      ? supabase.from('saved_artworks').select('artwork_id').in('artwork_id', artworkIds)
      : Promise.resolve({ data: [] }),
    artworkIds.length > 0
      ? (supabase as any).from('artwork_views').select('artwork_id').in('artwork_id', artworkIds)
      : Promise.resolve({ data: [] }),
  ]);

  const likesMap = new Map<string, number>();
  ((savedArtworksRes?.data as any[]) || []).forEach((s) => {
    if (s?.artwork_id) {
      likesMap.set(s.artwork_id, (likesMap.get(s.artwork_id) || 0) + 1);
    }
  });

  const viewsMap = new Map<string, number>();
  ((artworkViewsRes?.data as any[]) || []).forEach((v) => {
    if (v?.artwork_id) {
      viewsMap.set(v.artwork_id, (viewsMap.get(v.artwork_id) || 0) + 1);
    }
  });

  const enrichedArtworks = (artworks || []).map((a) => ({
    ...a,
    likes_count: a.likes_count ?? likesMap.get(a.id) ?? 0,
    views_count: a.views_count ?? viewsMap.get(a.id) ?? 0,
  }));

  const totalProfileViews =
    profile?.profile_views_count ?? profileViewsRes?.count ?? 0;

  return (
    <PortfolioClient
      initialArtworks={enrichedArtworks}
      initialCollections={collections || []}
      profile={profile}
      collectionsCount={collections?.length || 0}
      chatCount={chatCount || 0}
      artworkCount={artworkCount || 0}
      completeness={completeness}
      isLimited={isLimited}
      userId={user.id}
      profileViews={totalProfileViews}
    />
  );
}

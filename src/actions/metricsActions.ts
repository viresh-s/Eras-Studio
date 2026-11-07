'use server';

import { createClient, getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * Record an artwork view in the database.
 * Uses atomic RPC if available, or direct table insert/update fallback.
 * Employs getSupabaseAdmin() to allow anonymous visitors and guests to register views.
 */
export async function recordArtworkView(artworkId: string, viewerId?: string | null) {
  if (!artworkId) return;

  try {
    const admin = getSupabaseAdmin();
    const client: any = admin || (await createClient());

    // 1. Try stored procedure
    const { error: rpcError } = await client.rpc('increment_artwork_view', {
      target_artwork_id: artworkId,
      viewer_user_id: viewerId || null,
      client_ip_hash: null,
    });

    if (!rpcError) {
      return;
    }

    // 2. Fallback: insert log if table exists
    await client.from('artwork_views').insert({
      artwork_id: artworkId,
      viewer_id: viewerId || null,
    });

    // 3. Fallback: increment counter on artworks table
    const { data: artwork } = await client
      .from('artworks')
      .select('views_count')
      .eq('id', artworkId)
      .maybeSingle();

    if (artwork && typeof artwork.views_count === 'number') {
      await client
        .from('artworks')
        .update({ views_count: artwork.views_count + 1 })
        .eq('id', artworkId);
    }
  } catch (error) {
    // Non-blocking error handling for analytics/view recording
    console.warn('Silent notice: Could not record artwork view:', error);
  }
}

/**
 * Record a profile view in the database.
 */
export async function recordProfileView(profileId: string, viewerId?: string | null) {
  if (!profileId) return;

  try {
    const admin = getSupabaseAdmin();
    const client: any = admin || (await createClient());

    // 1. Try stored procedure
    const { error: rpcError } = await client.rpc('increment_profile_view', {
      target_profile_id: profileId,
      viewer_user_id: viewerId || null,
      client_ip_hash: null,
    });

    if (!rpcError) {
      return;
    }

    // 2. Fallback: insert log if table exists
    await client.from('profile_views').insert({
      profile_id: profileId,
      viewer_id: viewerId || null,
    });

    // 3. Fallback: increment counter on profiles table
    const { data: profile } = await client
      .from('profiles')
      .select('profile_views_count')
      .eq('id', profileId)
      .maybeSingle();

    if (profile && typeof profile.profile_views_count === 'number') {
      await client
        .from('profiles')
        .update({ profile_views_count: profile.profile_views_count + 1 })
        .eq('id', profileId);
    }
  } catch (error) {
    console.warn('Silent notice: Could not record profile view:', error);
  }
}

/**
 * Fetch likes and views count for a specific artwork.
 */
export async function getArtworkMetrics(artworkId: string): Promise<{ views: number; likes: number }> {
  try {
    const supabase: any = await createClient();

    const [viewsRes, likesRes, artworkRes] = await Promise.all([
      supabase.from('artwork_views').select('*', { count: 'exact', head: true }).eq('artwork_id', artworkId),
      supabase.from('saved_artworks').select('*', { count: 'exact', head: true }).eq('artwork_id', artworkId),
      supabase.from('artworks').select('views_count, likes_count').eq('id', artworkId).maybeSingle(),
    ]);

    const views = artworkRes.data?.views_count ?? viewsRes.count ?? 0;
    const likes = artworkRes.data?.likes_count ?? likesRes.count ?? 0;

    return { views, likes };
  } catch {
    return { views: 0, likes: 0 };
  }
}

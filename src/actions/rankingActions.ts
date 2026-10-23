'use server';

import { createClient } from '@/lib/supabase/server';
import { calculateCreatorScore, RankedCreator } from '@/lib/services/rankingService';

/**
 * Server Action: Calculates and fetches the top ranked creators dynamically.
 * Every inquiry, save, published artwork, or profile update is reflected immediately.
 */
export async function fetchTopCreatorsAction(limit: number = 10): Promise<RankedCreator[]> {
  try {
    const supabase = await createClient();

    // 1. Attempt PostgreSQL RPC if installed
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_top_creators', {
      limit_count: limit,
    });

    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      return (rpcData as any[]).map((row: any, idx: number) => ({
        id: row.creator_id,
        name: row.full_name || 'Anonymous Creator',
        profilePicUrl: row.profile_pic_url || null,
        discipline: row.primary_medium || 'Visual Arts',
        location: [row.location_city, row.location_country].filter(Boolean).join(', ') || null,
        isPremium: Boolean(row.is_premium || row.plan === 'pro' || row.plan === 'elite'),
        plan: row.plan || 'free',
        score: Number(row.score) || 0,
        rank: idx + 1,
        artworkCount: Number(row.artwork_count) || 0,
        soldCount: Number(row.sold_count) || 0,
        inquiryCount: Number(row.inquiry_count) || 0,
        saveCount: Number(row.save_count) || 0,
      }));
    }

    // 2. Direct table calculation fallback
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name, profile_pic_url, primary_medium, location_city, location_country, is_premium, plan, about_me, artist_statement, awards, created_at')
      .eq('role', 'Creator');

    if (pError || !profiles || profiles.length === 0) {
      return [];
    }

    const [artworksRes, inquiriesRes, savesRes] = await Promise.all([
      supabase
        .from('artworks')
        .select('id, creator_id, image_url, status, is_published, created_at')
        .eq('is_published', true),
      supabase
        .from('inquiries_chats')
        .select('id, creator_id, created_at'),
      (supabase as any)
        .from('saved_artworks')
        .select('id, artwork_id'),
    ]);

    const artworks = artworksRes.data;
    const inquiries = inquiriesRes.data;
    const saves = savesRes.data;

    const artworkMap = new Map<string, any[]>();
    const artworkFeaturedImage = new Map<string, string>();
    (artworks || []).forEach((art: any) => {
      const list = artworkMap.get(art.creator_id) || [];
      list.push(art);
      artworkMap.set(art.creator_id, list);
      if (!artworkFeaturedImage.has(art.creator_id) && art.image_url) {
        artworkFeaturedImage.set(art.creator_id, art.image_url);
      }
    });

    const inquiryMap = new Map<string, any[]>();
    (inquiries || []).forEach((inq: any) => {
      const list = inquiryMap.get(inq.creator_id) || [];
      list.push(inq);
      inquiryMap.set(inq.creator_id, list);
    });

    const saveCountPerArtwork = new Map<string, number>();
    ((saves as any[]) || []).forEach((s: any) => {
      if (s?.artwork_id) {
        saveCountPerArtwork.set(s.artwork_id, (saveCountPerArtwork.get(s.artwork_id) || 0) + 1);
      }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const scoredCreators: (RankedCreator & { latestActivity: number })[] = [];

    for (const p of profiles) {
      const userArtworks = artworkMap.get(p.id) || [];
      if (userArtworks.length === 0) continue;

      const userInquiries = inquiryMap.get(p.id) || [];
      const recentInquiries = userInquiries.filter(
        (i) => i.created_at && new Date(i.created_at) > thirtyDaysAgo
      );

      let totalSaves = 0;
      userArtworks.forEach((a) => {
        totalSaves += saveCountPerArtwork.get(a.id) || 0;
      });

      const soldCount = userArtworks.filter((a) => a.status === 'Sold').length;

      const score = calculateCreatorScore({
        inquiryCount: userInquiries.length,
        recentInquiryCount: recentInquiries.length,
        saveCount: totalSaves,
        publishedArtworkCount: userArtworks.length,
        soldArtworkCount: soldCount,
        isPremium: Boolean(p.is_premium),
        plan: (p.plan || 'free').toLowerCase(),
        hasProfilePic: Boolean(p.profile_pic_url),
        hasBio: Boolean(p.about_me),
        hasDiscipline: Boolean(p.primary_medium),
        hasAwardsOrStatement: Boolean(p.awards || p.artist_statement),
      });

      const latestArtDate = userArtworks.reduce(
        (max, a) => Math.max(max, a.created_at ? new Date(a.created_at).getTime() : 0),
        0
      );
      const latestInqDate = userInquiries.reduce(
        (max, i) => Math.max(max, i.created_at ? new Date(i.created_at).getTime() : 0),
        0
      );
      const profileCreatedDate = p.created_at ? new Date(p.created_at).getTime() : 0;
      const latestActivity = Math.max(latestArtDate, latestInqDate, profileCreatedDate);

      scoredCreators.push({
        id: p.id,
        name: p.full_name || 'Anonymous Creator',
        profilePicUrl: p.profile_pic_url || null,
        discipline: p.primary_medium || 'Visual Arts',
        location: [p.location_city, p.location_country].filter(Boolean).join(', ') || null,
        isPremium: Boolean(p.is_premium || p.plan === 'pro' || p.plan === 'elite'),
        plan: p.plan || 'free',
        score,
        rank: 0,
        artworkCount: userArtworks.length,
        soldCount,
        inquiryCount: userInquiries.length,
        saveCount: totalSaves,
        featuredImageUrl: artworkFeaturedImage.get(p.id) || null,
        latestActivity,
      });
    }

    scoredCreators.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.latestActivity !== a.latestActivity) return b.latestActivity - a.latestActivity;
      return b.artworkCount - a.artworkCount;
    });

    const ranked = scoredCreators.map((c, i) => ({
      ...c,
      rank: i + 1,
    }));

    return ranked.slice(0, limit);
  } catch (err) {
    console.error('Error in fetchTopCreatorsAction:', err);
    return [];
  }
}

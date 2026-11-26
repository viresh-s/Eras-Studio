'use server';

import { createClient, getSupabaseAdmin } from '@/lib/supabase/server';
import { calculateCreatorScore, getFallbackSeedCreators, RankedCreator } from '@/lib/services/rankingService';

/**
 * Server Action: Calculates and fetches the top ranked creators dynamically.
 * Every inquiry, save, published artwork, or profile update is reflected immediately.
 * Uses getSupabaseAdmin() to bypass RLS and read accurate cross-creator platform metrics (inquiries & saves).
 */
export async function fetchTopCreatorsAction(limit: number = 10): Promise<RankedCreator[]> {
  try {
    const supabase = getSupabaseAdmin() || (await createClient());

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
      .select('id, full_name, profile_pic_url, cover_image_url, primary_medium, location_city, location_country, is_premium, plan, about_me, artist_statement, awards, created_at')
      .eq('role', 'Creator');

    if (pError || !profiles || profiles.length === 0) {
      return getFallbackSeedCreators(limit);
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
        discipline: (p.primary_medium && p.primary_medium.trim()) ? p.primary_medium.trim() : 'Visual Arts',
        location: [p.location_city, p.location_country].filter(Boolean).join(', ') || null,
        isPremium: Boolean(p.is_premium || p.plan === 'pro' || p.plan === 'elite'),
        plan: p.plan || 'free',
        score,
        rank: 0,
        artworkCount: userArtworks.length,
        soldCount,
        inquiryCount: userInquiries.length,
        saveCount: totalSaves,
        featuredImageUrl: artworkFeaturedImage.get(p.id) || p.cover_image_url || null,
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

    if (ranked.length === 0) {
      return getFallbackSeedCreators(limit);
    }

    return ranked.slice(0, limit);
  } catch (err) {
    console.error('Error in fetchTopCreatorsAction:', err);
    return getFallbackSeedCreators(limit);
  }
}

export interface RankedArtworkParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
  artTypeFilter?: string;
  priceFilter?: 'all' | 'under10k' | '10k-50k' | '50kPlus' | 'on_request' | string;
  sortBy?: 'recommended' | 'newest' | 'price_asc' | 'price_desc' | string;
}

export interface RankedArtworkResult {
  artworks: any[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Server Action: Calculates and fetches ranked discovery artworks.
 *
 * Discovery Priority Order:
 * - Priority 1 (Highest priority): Interest raised (Inquiries via `inquiries_chats`) -> 40 pts each
 * - Priority 2 (Second priority): Views (`views_count` on artworks) -> 3 pts each
 * - Priority 3 (Third priority): Likes (`likes_count` / `saved_artworks`) -> 2 pts each
 * - Temporary Freshness Boost:
 *     <= 3 days: +30 pts
 *     <= 7 days: +18 pts
 *     <= 14 days: +10 pts
 *     <= 30 days: +4 pts
 *
 * Artworks are ranked by this composite score in descending order, naturally placing
 * the top-performing artworks in Row 1, Row 2, Row 3... of the discovery grid.
 */
export async function fetchRankedDiscoveryArtworksAction(
  params: RankedArtworkParams = {}
): Promise<RankedArtworkResult> {
  const {
    page = 1,
    limit = 16,
    searchQuery = '',
    artTypeFilter = '',
    priceFilter = 'all',
    sortBy = 'recommended',
  } = params;

  try {
    const admin = getSupabaseAdmin();
    const supabase = (admin || (await createClient())) as any;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Base query for available artworks
    let query = supabase
      .from('artworks')
      .select(
        'id, creator_id, title, art_type, artist_name, image_url, price, price_visibility, status, year, created_at, views_count, likes_count, profiles(full_name, profile_pic_url)',
        { count: 'exact' }
      )
      .eq('status', 'Available');

    // Search filter on title and artist_name
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      query = query.or(`title.ilike.%${q}%,artist_name.ilike.%${q}%`);
    }

    // Category / medium filter
    if (artTypeFilter) {
      query = query.eq('art_type', artTypeFilter);
    }

    // Price filter
    if (priceFilter === 'on_request') {
      query = query.eq('price_visibility', 'Price on Request');
    } else if (priceFilter === 'under10k') {
      query = query.lte('price', 10000).neq('price_visibility', 'Price on Request');
    } else if (priceFilter === '10k-50k') {
      query = query.gte('price', 10000).lte('price', 50000).neq('price_visibility', 'Price on Request');
    } else if (priceFilter === '50kPlus') {
      query = query.gte('price', 50000).neq('price_visibility', 'Price on Request');
    }

    // Explicit sorts (price, newest) handled directly in SQL
    if (sortBy === 'price_asc') {
      query = query.order('price', { ascending: true, nullsFirst: false }).range(from, to);
      const { data, count, error } = await query;
      if (error) throw error;
      return {
        artworks: data || [],
        totalCount: count || 0,
        hasMore: count !== null ? from + (data?.length || 0) < count : (data?.length || 0) === limit,
      };
    }

    if (sortBy === 'price_desc') {
      query = query.order('price', { ascending: false, nullsFirst: false }).range(from, to);
      const { data, count, error } = await query;
      if (error) throw error;
      return {
        artworks: data || [],
        totalCount: count || 0,
        hasMore: count !== null ? from + (data?.length || 0) < count : (data?.length || 0) === limit,
      };
    }

    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false }).range(from, to);
      const { data, count, error } = await query;
      if (error) throw error;
      return {
        artworks: data || [],
        totalCount: count || 0,
        hasMore: count !== null ? from + (data?.length || 0) < count : (data?.length || 0) === limit,
      };
    }

    // =========================================================================
    // Recommended Sort: Multi-signal Priority Ranking with Freshness Boost
    // Priority 1: Interest raised (Inquiries from inquiries_chats) -> 40 pts each
    // Priority 2: Views (views_count) -> 3 pts each
    // Priority 3: Likes (likes_count / saved_artworks) -> 2 pts each
    // Freshness Boost: Temporary score boost for newly uploaded artworks
    // =========================================================================
    const [{ data: candidateArtworks, count: totalCandidateCount }, { data: inqRows }, { data: saveRows }] =
      await Promise.all([
        query,
        supabase.from('inquiries_chats').select('artwork_id'),
        supabase.from('saved_artworks').select('artwork_id'),
      ]);

    if (!candidateArtworks || candidateArtworks.length === 0) {
      return { artworks: [], totalCount: 0, hasMore: false };
    }

    // Map inquiries count per artwork
    const inqMap = new Map<string, number>();
    ((inqRows as any[]) || []).forEach((row: any) => {
      if (row?.artwork_id) {
        inqMap.set(row.artwork_id, (inqMap.get(row.artwork_id) || 0) + 1);
      }
    });

    // Map saved/likes count per artwork
    const saveMap = new Map<string, number>();
    ((saveRows as any[]) || []).forEach((row: any) => {
      if (row?.artwork_id) {
        saveMap.set(row.artwork_id, (saveMap.get(row.artwork_id) || 0) + 1);
      }
    });

    const now = Date.now();
    const scoredArtworks = (candidateArtworks as any[]).map((artwork: any) => {
      const inqCount = inqMap.get(artwork.id) || 0;
      const viewsCount = Number(artwork.views_count) || 0;
      const likesCount = Number(artwork.likes_count) || saveMap.get(artwork.id) || 0;

      const createdTime = artwork.created_at ? new Date(artwork.created_at).getTime() : 0;
      const ageDays = (now - createdTime) / (1000 * 60 * 60 * 24);

      // Temporary freshness boost for new artworks
      let freshnessBoost = 0;
      if (ageDays <= 3) {
        freshnessBoost = 30; // Strongest boost in first 3 days
      } else if (ageDays <= 7) {
        freshnessBoost = 18; // Week-1 boost
      } else if (ageDays <= 14) {
        freshnessBoost = 10; // Two-week boost
      } else if (ageDays <= 30) {
        freshnessBoost = 4; // Month-1 boost
      }

      // Priority calculation:
      // Priority 1: Interest Raised (40 pts per inquiry)
      // Priority 2: Views (3 pts per view)
      // Priority 3: Likes (2 pts per like)
      const engagementScore = (inqCount * 40) + (viewsCount * 3) + (likesCount * 2) + freshnessBoost;

      return {
        ...artwork,
        _score: engagementScore,
        _inqCount: inqCount,
        _viewsCount: viewsCount,
        _likesCount: likesCount,
        _freshnessBoost: freshnessBoost,
      };
    });

    // Sort descending by engagement score, tiebreak with newest created_at
    scoredArtworks.sort((a: any, b: any) => {
      if (b._score !== a._score) {
        return b._score - a._score;
      }
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });

    const pageArtworks = scoredArtworks.slice(from, to + 1);
    const totalCount = totalCandidateCount ?? scoredArtworks.length;
    const hasMore = from + pageArtworks.length < scoredArtworks.length;

    return {
      artworks: pageArtworks,
      totalCount,
      hasMore,
    };
  } catch (error) {
    console.error('Error in fetchRankedDiscoveryArtworksAction:', error);
    return { artworks: [], totalCount: 0, hasMore: false };
  }
}

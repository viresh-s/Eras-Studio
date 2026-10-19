import { createClient } from '@/lib/supabase/client';

export interface RankedCreator {
  id: string;
  name: string;
  profilePicUrl?: string | null;
  discipline: string;
  location?: string | null;
  isPremium: boolean;
  plan?: string | null;
  score: number;
  rank: number;
  artworkCount: number;
  soldCount: number;
  inquiryCount: number;
  saveCount: number;
  featuredImageUrl?: string | null;
}

export interface CreatorScoringFactors {
  inquiryCount: number;
  recentInquiryCount: number; // Inquiries within last 30 days
  saveCount: number;
  publishedArtworkCount: number;
  soldArtworkCount: number;
  isPremium: boolean;
  plan: string;
  hasProfilePic: boolean;
  hasBio: boolean;
  hasDiscipline: boolean;
  hasAwardsOrStatement: boolean;
}

/**
 * Real-time Mathematical Scoring Formula:
 * Total Maximum Score: 100 Points
 *
 * 1. Collector Inquiries (Max: 35 pts):
 *    - Base: 7 pts per unique inquiry (up to 28 pts)
 *    - Momentum: 3.5 pts per recent inquiry (within last 30 days, up to 7 pts)
 * 2. Collector Saves / Bookmarks (Max: 25 pts):
 *    - 5 pts per save across creator's catalog (up to 25 pts)
 * 3. Portfolio Depth & Commercial Track Record (Max: 20 pts):
 *    - 4 pts per active published artwork (up to 12 pts)
 *    - 4 pts per confirmed sold artwork (up to 8 pts)
 * 4. Tier & Curatorial Verification (Max: 10 pts):
 *    - 10 pts for Pro / Elite / COR verified members
 * 5. Profile Completeness & Authenticity (Max: 10 pts):
 *    - Headshot / Profile Pic: +3 pts
 *    - Bio / Statement: +3 pts
 *    - Discipline / Medium: +2 pts
 *    - Awards or Statement: +2 pts
 */
export function calculateCreatorScore(factors: CreatorScoringFactors): number {
  // 1. Inquiries (Max 35)
  const baseInquiries = Math.min(factors.inquiryCount * 7, 28);
  const recentInquiries = Math.min(factors.recentInquiryCount * 3.5, 7);
  const inquiryScore = Math.min(baseInquiries + recentInquiries, 35);

  // 2. Saves (Max 25)
  const saveScore = Math.min(factors.saveCount * 5, 25);

  // 3. Portfolio & Sales (Max 20)
  const portfolioScore = Math.min(factors.publishedArtworkCount * 4, 12);
  const soldScore = Math.min(factors.soldArtworkCount * 4, 8);
  const craftScore = Math.min(portfolioScore + soldScore, 20);

  // 4. Tier & Membership (Max 10)
  const tierScore = (factors.isPremium || factors.plan === 'pro' || factors.plan === 'elite') ? 10 : 0;

  // 5. Completeness (Max 10)
  let completenessScore = 0;
  if (factors.hasProfilePic) completenessScore += 3;
  if (factors.hasBio) completenessScore += 3;
  if (factors.hasDiscipline) completenessScore += 2;
  if (factors.hasAwardsOrStatement) completenessScore += 2;

  const total = inquiryScore + saveScore + craftScore + tierScore + completenessScore;
  return Math.min(Math.round(total), 100);
}

/**
 * Fetches and ranks creators dynamically in real-time.
 * Every time any creator gains an inquiry, save, artwork, or profile edit,
 * their score recalculates instantly on the next load.
 */
export async function getTopCreators(limit: number = 10): Promise<RankedCreator[]> {
  try {
    const supabase = createClient();

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

    // 2. Direct table fallback calculation
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name, profile_pic_url, primary_medium, location_city, location_country, is_premium, plan, about_me, artist_statement, awards, created_at')
      .eq('role', 'Creator');

    if (pError || !profiles || profiles.length === 0) {
      return getFallbackSeedCreators(limit);
    }

    const { data: artworks } = await supabase
      .from('artworks')
      .select('id, creator_id, image_url, status, is_published, created_at')
      .eq('is_published', true);

    const { data: inquiries } = await supabase
      .from('inquiries_chats')
      .select('id, creator_id, created_at');

    const { data: saves } = await (supabase as any)
      .from('saved_artworks')
      .select('id, artwork_id');

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

    if (ranked.length < limit) {
      const fallback = getFallbackSeedCreators(limit - ranked.length);
      const existingIds = new Set(ranked.map((r) => r.id));
      const filteredFallback = fallback.filter((f) => !existingIds.has(f.id));
      const combined = [...ranked, ...filteredFallback].slice(0, limit);
      return combined.map((c, i) => ({ ...c, rank: i + 1 }));
    }

    return ranked.slice(0, limit);
  } catch (err) {
    console.error('Error computing top creators:', err);
    return getFallbackSeedCreators(limit);
  }
}

function getFallbackSeedCreators(limit: number): RankedCreator[] {
  const curatedShowcase: RankedCreator[] = [
    {
      id: 'crt_01',
      name: 'Sora Takahashi',
      profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      discipline: 'Kinetic Sculpture',
      location: 'Kyoto, Japan',
      isPremium: true,
      plan: 'pro',
      score: 96,
      rank: 1,
      artworkCount: 8,
      soldCount: 3,
      inquiryCount: 14,
      saveCount: 42,
    },
    {
      id: 'crt_02',
      name: 'Amina Al-Mansoor',
      profilePicUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
      discipline: 'Terracotta & Ceramics',
      location: 'Dubai, UAE',
      isPremium: true,
      plan: 'elite',
      score: 94,
      rank: 2,
      artworkCount: 6,
      soldCount: 2,
      inquiryCount: 11,
      saveCount: 38,
    },
    {
      id: 'crt_03',
      name: 'Julian Wei',
      profilePicUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      discipline: 'Spatial Media & Light',
      location: 'Berlin, Germany',
      isPremium: true,
      plan: 'pro',
      score: 91,
      rank: 3,
      artworkCount: 5,
      soldCount: 2,
      inquiryCount: 9,
      saveCount: 29,
    },
    {
      id: 'crt_05',
      name: 'Camille Dupont',
      profilePicUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      discipline: 'Carved Limestone',
      location: 'Paris, France',
      isPremium: true,
      plan: 'pro',
      score: 88,
      rank: 4,
      artworkCount: 4,
      soldCount: 1,
      inquiryCount: 7,
      saveCount: 24,
    },
    {
      id: 'crt_06',
      name: 'Zainab Idowu',
      profilePicUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80',
      discipline: 'Textile Tapestry',
      location: 'Lagos, Nigeria',
      isPremium: true,
      plan: 'pro',
      score: 87,
      rank: 5,
      artworkCount: 7,
      soldCount: 2,
      inquiryCount: 8,
      saveCount: 31,
    },
    {
      id: 'crt_08',
      name: 'Hana Ishikawa',
      profilePicUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      discipline: 'Minimalist Woodwork',
      location: 'Tokyo, Japan',
      isPremium: true,
      plan: 'elite',
      score: 85,
      rank: 6,
      artworkCount: 5,
      soldCount: 1,
      inquiryCount: 6,
      saveCount: 22,
    },
    {
      id: 'crt_09',
      name: 'Priya Nair',
      profilePicUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
      discipline: 'Stoneware & Ash Glaze',
      location: 'Jaipur, India',
      isPremium: true,
      plan: 'pro',
      score: 83,
      rank: 7,
      artworkCount: 4,
      soldCount: 1,
      inquiryCount: 5,
      saveCount: 19,
    },
    {
      id: 'crt_10',
      name: 'Nicoletta Rossi',
      profilePicUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&auto=format&fit=crop&q=80',
      discipline: 'Architectural Installations',
      location: 'Milan, Italy',
      isPremium: true,
      plan: 'elite',
      score: 81,
      rank: 8,
      artworkCount: 3,
      soldCount: 1,
      inquiryCount: 5,
      saveCount: 17,
    },
    {
      id: 'crt_12',
      name: 'Aria Montgomery',
      profilePicUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
      discipline: 'Pigment on Raw Linen',
      location: 'London, UK',
      isPremium: true,
      plan: 'pro',
      score: 79,
      rank: 9,
      artworkCount: 4,
      soldCount: 0,
      inquiryCount: 4,
      saveCount: 15,
    },
    {
      id: 'crt_14',
      name: 'Rafael Orozco',
      profilePicUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
      discipline: 'Volcanic Basalt Carving',
      location: 'Oaxaca, Mexico',
      isPremium: true,
      plan: 'elite',
      score: 78,
      rank: 10,
      artworkCount: 3,
      soldCount: 0,
      inquiryCount: 4,
      saveCount: 14,
    },
  ];

  return curatedShowcase.slice(0, limit).map((c, i) => ({
    ...c,
    rank: i + 1,
  }));
}

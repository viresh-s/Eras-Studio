-- =============================================
-- ERAS Top Creators & Discovery Ranking
-- Dynamic scoring function for real-time leaderboards
-- Run this in Supabase SQL Editor
-- =============================================

CREATE OR REPLACE FUNCTION public.get_top_creators(limit_count INT DEFAULT 10)
RETURNS TABLE (
  creator_id UUID,
  full_name TEXT,
  profile_pic_url TEXT,
  primary_medium TEXT,
  location_city TEXT,
  location_country TEXT,
  is_premium BOOLEAN,
  plan TEXT,
  artwork_count BIGINT,
  sold_count BIGINT,
  inquiry_count BIGINT,
  save_count BIGINT,
  score NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH creator_stats AS (
    SELECT 
      p.id AS c_id,
      p.full_name AS c_name,
      p.profile_pic_url AS c_pic,
      p.primary_medium AS c_medium,
      p.location_city AS c_city,
      p.location_country AS c_country,
      COALESCE(p.is_premium, false) AS c_premium,
      COALESCE(p.plan, 'free') AS c_plan,
      -- Count published artworks
      COUNT(DISTINCT a.id) FILTER (WHERE a.is_published = true) AS c_artworks,
      -- Count sold artworks
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'Sold') AS c_sold,
      -- Count total buyer inquiries
      COUNT(DISTINCT ic.id) AS c_inquiries,
      -- Count total artwork saves
      COUNT(DISTINCT sa.id) AS c_saves,
      -- Max activity timestamp
      GREATEST(
        COALESCE(MAX(a.created_at), p.created_at),
        COALESCE(MAX(ic.created_at), p.created_at),
        p.created_at
      ) AS latest_activity,
      p.created_at AS c_created_at
    FROM public.profiles p
    LEFT JOIN public.artworks a ON a.creator_id = p.id
    LEFT JOIN public.inquiries_chats ic ON ic.creator_id = p.id
    LEFT JOIN public.saved_artworks sa ON sa.artwork_id = a.id
    WHERE p.role = 'Creator'
    GROUP BY p.id
  )
  SELECT 
    cs.c_id,
    cs.c_name,
    cs.c_pic,
    cs.c_medium,
    cs.c_city,
    cs.c_country,
    cs.c_premium,
    cs.c_plan,
    cs.c_artworks,
    cs.c_sold,
    cs.c_inquiries,
    cs.c_saves,
    (
      -- 1. Collector Inquiries (Max: 35 pts): 7 pts per inquiry
      LEAST(cs.c_inquiries * 7, 35) +
      -- 2. Saves & Bookmarks (Max: 25 pts): 5 pts per save
      LEAST(cs.c_saves * 5, 25) +
      -- 3. Portfolio & Sales (Max: 20 pts): 4 pts per work (max 12) + 4 pts per sold work (max 8)
      LEAST(cs.c_artworks * 4, 12) + LEAST(cs.c_sold * 4, 8) +
      -- 4. Tier Boost (Max: 10 pts): Pro or Elite membership
      CASE WHEN cs.c_premium = true OR cs.c_plan IN ('pro', 'elite') THEN 10 ELSE 0 END +
      -- 5. Profile Completeness (Max: 10 pts)
      CASE WHEN cs.c_pic IS NOT NULL AND cs.c_pic != '' THEN 4 ELSE 0 END +
      CASE WHEN cs.c_medium IS NOT NULL AND cs.c_medium != '' THEN 3 ELSE 0 END +
      CASE WHEN cs.c_city IS NOT NULL AND cs.c_city != '' THEN 3 ELSE 0 END
    )::NUMERIC AS calculated_score
  FROM creator_stats cs
  WHERE cs.c_artworks >= 1 -- must have at least 1 artwork
  ORDER BY calculated_score DESC, cs.latest_activity DESC, cs.c_artworks DESC
  LIMIT limit_count;
END;
$$;

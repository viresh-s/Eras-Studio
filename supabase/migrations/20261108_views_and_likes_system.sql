-- ====================================================================
-- ERAS Studio: Artwork Views, Profile Views, and Likes Tracking System
-- Run this migration in your Supabase SQL Editor.
-- ====================================================================

-- 1. Add view and like counters to public.artworks
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 2. Add profile view counter to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_views_count INTEGER DEFAULT 0;

-- 3. Create artwork_views log table
CREATE TABLE IF NOT EXISTS public.artwork_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_hash TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create profile_views log table
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_hash TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_artwork_views_artwork_id ON public.artwork_views(artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_views_viewer_id ON public.artwork_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_artwork_views_created_at ON public.artwork_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON public.profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON public.profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created_at ON public.profile_views(viewed_at);

-- 5. Row Level Security (RLS)
ALTER TABLE public.artwork_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Allow recording views by anyone (authenticated or guest)
DROP POLICY IF EXISTS "Anyone can record artwork views" ON public.artwork_views;
CREATE POLICY "Anyone can record artwork views"
  ON public.artwork_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Creators can view their artwork views" ON public.artwork_views;
CREATE POLICY "Creators can view their artwork views"
  ON public.artwork_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.artworks a
      WHERE a.id = artwork_views.artwork_id AND a.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can record profile views" ON public.profile_views;
CREATE POLICY "Anyone can record profile views"
  ON public.profile_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Creators can view their profile views" ON public.profile_views;
CREATE POLICY "Creators can view their profile views"
  ON public.profile_views FOR SELECT
  USING (profile_id = auth.uid());

-- 6. Atomic increment function for artwork views
CREATE OR REPLACE FUNCTION public.increment_artwork_view(
  target_artwork_id UUID,
  viewer_user_id UUID DEFAULT NULL,
  client_ip_hash TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert view record
  INSERT INTO public.artwork_views (artwork_id, viewer_id, ip_hash)
  VALUES (target_artwork_id, viewer_user_id, client_ip_hash);

  -- Atomic increment on artwork row
  UPDATE public.artworks
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = target_artwork_id;
END;
$$;

-- 7. Atomic increment function for profile views
CREATE OR REPLACE FUNCTION public.increment_profile_view(
  target_profile_id UUID,
  viewer_user_id UUID DEFAULT NULL,
  client_ip_hash TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert view record
  INSERT INTO public.profile_views (profile_id, viewer_id, ip_hash)
  VALUES (target_profile_id, viewer_user_id, client_ip_hash);

  -- Atomic increment on profile row
  UPDATE public.profiles
  SET profile_views_count = COALESCE(profile_views_count, 0) + 1
  WHERE id = target_profile_id;
END;
$$;

-- 8. Auto-sync artwork likes_count whenever saved_artworks changes
CREATE OR REPLACE FUNCTION public.sync_artwork_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.artwork_id, OLD.artwork_id);
  
  UPDATE public.artworks
  SET likes_count = (
    SELECT COUNT(*) 
    FROM public.saved_artworks 
    WHERE artwork_id = target_id
  )
  WHERE id = target_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_artwork_likes ON public.saved_artworks;
CREATE TRIGGER trg_sync_artwork_likes
AFTER INSERT OR DELETE ON public.saved_artworks
FOR EACH ROW EXECUTE FUNCTION public.sync_artwork_likes_count();

-- 9. Backfill initial likes_count from existing saved_artworks
UPDATE public.artworks a
SET likes_count = (
  SELECT COUNT(*)
  FROM public.saved_artworks sa
  WHERE sa.artwork_id = a.id
);


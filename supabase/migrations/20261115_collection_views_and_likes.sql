-- ====================================================================
-- ERAS Studio: Collection Views and Likes Tracking System
-- Run this migration in your Supabase SQL Editor.
-- ====================================================================

-- 1. Add views and likes counter columns to public.collections
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 2. Create collection_views log table
CREATE TABLE IF NOT EXISTS public.collection_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_hash TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create saved_collections log table
CREATE TABLE IF NOT EXISTS public.saved_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collection_views_col_id ON public.collection_views(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_views_viewer_id ON public.collection_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_collection_views_created_at ON public.collection_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_saved_collections_col_id ON public.saved_collections(collection_id);
CREATE INDEX IF NOT EXISTS idx_saved_collections_user_id ON public.saved_collections(user_id);

-- 4. Row Level Security (RLS)
ALTER TABLE public.collection_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_collections ENABLE ROW LEVEL SECURITY;

-- Allow recording views by anyone (authenticated or guest)
DROP POLICY IF EXISTS "Anyone can record collection views" ON public.collection_views;
CREATE POLICY "Anyone can record collection views"
  ON public.collection_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Creators can view their collection views" ON public.collection_views;
CREATE POLICY "Creators can view their collection views"
  ON public.collection_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_views.collection_id AND c.creator_id = auth.uid()
    )
  );

-- Saved collections policies
DROP POLICY IF EXISTS "Anyone can view saved collections" ON public.saved_collections;
CREATE POLICY "Anyone can view saved collections"
  ON public.saved_collections FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can toggle save collection" ON public.saved_collections;
CREATE POLICY "Authenticated users can toggle save collection"
  ON public.saved_collections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Atomic increment function for collection views
CREATE OR REPLACE FUNCTION public.increment_collection_view(
  target_collection_id UUID,
  viewer_user_id UUID DEFAULT NULL,
  client_ip_hash TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.collection_views (collection_id, viewer_id, ip_hash)
  VALUES (target_collection_id, viewer_user_id, client_ip_hash);

  UPDATE public.collections
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = target_collection_id;
END;
$$;

-- 6. Auto-sync collection likes_count whenever saved_collections changes
CREATE OR REPLACE FUNCTION public.sync_collection_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.collection_id, OLD.collection_id);
  
  UPDATE public.collections
  SET likes_count = (
    SELECT COUNT(*) 
    FROM public.saved_collections 
    WHERE collection_id = target_id
  )
  WHERE id = target_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_collection_likes ON public.saved_collections;
CREATE TRIGGER trg_sync_collection_likes
AFTER INSERT OR DELETE ON public.saved_collections
FOR EACH ROW EXECUTE FUNCTION public.sync_collection_likes_count();

-- ==============================================================================
-- Migration: Standalone Collections Architecture
-- Description: Creates dedicated collections table, adds collection_id to artworks,
--              configures RLS security policies, and backfills from existing text data.
-- ==============================================================================

-- 1. Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add collection_id column to artworks table if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artworks' AND column_name = 'collection_id'
  ) THEN
    ALTER TABLE public.artworks ADD COLUMN collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- 4. Clean up any existing policies
DROP POLICY IF EXISTS "Public collections are viewable by everyone" ON public.collections;
DROP POLICY IF EXISTS "Creators can insert their own collections" ON public.collections;
DROP POLICY IF EXISTS "Creators can update their own collections" ON public.collections;
DROP POLICY IF EXISTS "Creators can delete their own collections" ON public.collections;

-- 5. RLS Policies
-- Anyone can view published collections; creators can always view their own
CREATE POLICY "Public collections are viewable by everyone"
ON public.collections
FOR SELECT
USING (
  is_published = true 
  OR auth.uid() = creator_id
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- Authenticated creators can insert their own collections
CREATE POLICY "Creators can insert their own collections"
ON public.collections
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = creator_id
);

-- Authenticated creators can update their own collections
CREATE POLICY "Creators can update their own collections"
ON public.collections
FOR UPDATE
TO authenticated
USING (
  auth.uid() = creator_id
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
)
WITH CHECK (
  auth.uid() = creator_id
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- Authenticated creators can delete their own collections
CREATE POLICY "Creators can delete their own collections"
ON public.collections
FOR DELETE
TO authenticated
USING (
  auth.uid() = creator_id
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_collections_creator_id ON public.collections(creator_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON public.collections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_collection_id ON public.artworks(collection_id);
CREATE INDEX IF NOT EXISTS idx_artworks_creator_collection ON public.artworks(creator_id, collection_id);

-- 7. Backfill existing text collections into the new collections table
DO $$
DECLARE
  rec RECORD;
  new_col_id UUID;
BEGIN
  -- Iterate through distinct existing collection names per creator
  FOR rec IN 
    SELECT DISTINCT creator_id, TRIM(collection) as col_name
    FROM public.artworks
    WHERE collection IS NOT NULL 
      AND TRIM(collection) <> ''
      AND LOWER(TRIM(collection)) <> 'other'
  LOOP
    -- Insert collection if it does not already exist for this creator
    SELECT id INTO new_col_id
    FROM public.collections
    WHERE creator_id = rec.creator_id AND LOWER(TRIM(title)) = LOWER(rec.col_name)
    LIMIT 1;

    IF new_col_id IS NULL THEN
      INSERT INTO public.collections (creator_id, title, is_published)
      VALUES (rec.creator_id, rec.col_name, true)
      RETURNING id INTO new_col_id;
    END IF;

    -- Update existing artworks that have this text collection
    UPDATE public.artworks
    SET collection_id = new_col_id
    WHERE creator_id = rec.creator_id 
      AND LOWER(TRIM(collection)) = LOWER(rec.col_name)
      AND (collection_id IS NULL OR collection_id <> new_col_id);
  END LOOP;
END $$;


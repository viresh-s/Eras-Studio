-- ==============================================================================
-- ERAS STUDIO MIGRATION: Reports & Moderation (Idempotent Fix)
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> Run)
-- ==============================================================================

-- 1. Create or update reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artwork_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure nullable artwork_id for user reports if table was created previously with NOT NULL
ALTER TABLE public.reports ALTER COLUMN artwork_id DROP NOT NULL;

-- Add reported_user_id column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'reported_user_id'
  ) THEN
    ALTER TABLE public.reports ADD COLUMN reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 3. Drop all previous/conflicting policies to ensure clean state
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own submitted reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update report status" ON public.reports;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.reports;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.reports;

-- 4. INSERT Policy: Allow any authenticated user to create a report
CREATE POLICY "Users can create reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reporter_user_id
  OR auth.uid() IS NOT NULL
);

-- 5. SELECT Policy: Users can view their own reports
CREATE POLICY "Users can view their own submitted reports"
ON public.reports
FOR SELECT
TO authenticated
USING (
  auth.uid() = reporter_user_id
);

-- 6. ADMIN Policies: Admins can view and update all reports
CREATE POLICY "Admins can view all reports"
ON public.reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

CREATE POLICY "Admins can update report status"
ON public.reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_reports_artwork_id ON public.reports(artwork_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_user_id ON public.reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

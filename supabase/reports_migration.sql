-- ==============================================================================
-- ERAS STUDIO MIGRATION: Artwork Reporting & Moderation
-- Run this in the Supabase SQL Editor to support Moderation & Safety features
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artwork_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'Possible copyright infringement',
    'Inappropriate / NSFW content',
    'Plagiarism or stolen work',
    'Spam or misleading information',
    'Harassment or hate speech',
    'Other / Policy violation'
  )),
  details TEXT CHECK (char_length(details) <= 2000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create reports' AND tablename = 'reports') THEN
    CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own submitted reports' AND tablename = 'reports') THEN
    CREATE POLICY "Users can view their own submitted reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all reports' AND tablename = 'reports') THEN
    CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update report status' AND tablename = 'reports') THEN
    CREATE POLICY "Admins can update report status" ON public.reports FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reports_artwork_id ON public.reports(artwork_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_user_id ON public.reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

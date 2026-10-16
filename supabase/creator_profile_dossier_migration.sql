-- =========================================================================
-- ERAS: Creator Profile Dossier & Verification Migration
-- Run this in Supabase SQL Editor if columns are not present
-- =========================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS artist_bio_file_url TEXT,
  ADD COLUMN IF NOT EXISTS cv_file_url TEXT,
  ADD COLUMN IF NOT EXISTS artist_statement_file_url TEXT,
  ADD COLUMN IF NOT EXISTS short_portfolio_file_url TEXT,
  ADD COLUMN IF NOT EXISTS long_portfolio_file_url TEXT,
  ADD COLUMN IF NOT EXISTS top_artworks_drive_url TEXT,
  ADD COLUMN IF NOT EXISTS has_project_proposals TEXT DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS latest_proposal_file_url TEXT;

-- Create creator-documents bucket if not present
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-documents', 'creator-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for creator-documents
CREATE POLICY "Public can view creator documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'creator-documents' OR bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload creator documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    (bucket_id = 'creator-documents' OR bucket_id = 'avatars')
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own creator documents"
  ON storage.objects FOR UPDATE
  USING (
    (bucket_id = 'creator-documents' OR bucket_id = 'avatars')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own creator documents"
  ON storage.objects FOR DELETE
  USING (
    (bucket_id = 'creator-documents' OR bucket_id = 'avatars')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

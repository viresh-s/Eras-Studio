-- =========================================================================
-- ERAS Studio: Database & Storage Security Hardening Migration
-- Date: 01 Nov 2026
-- Covers: P0.2 (RLS & integrity), P0.4 (Storage RLS), P0.6 (Slot conflict)
-- =========================================================================

-- 1. Restrict Artwork SELECT Policy: Drafts/unpublished artworks stay private
DROP POLICY IF EXISTS "Artworks are viewable by everyone" ON public.artworks;
DROP POLICY IF EXISTS "Published artworks or own artworks viewable" ON public.artworks;

CREATE POLICY "Published artworks or own artworks viewable"
  ON public.artworks FOR SELECT
  USING (
    is_published = true 
    OR auth.uid() = creator_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  );

-- 2. Prevent Overlapping Consultation Bookings at Database Level
CREATE UNIQUE INDEX IF NOT EXISTS uq_cor_consultations_consultant_slot
  ON public.cor_consultations(consultant_name, slot_time)
  WHERE status = 'scheduled';

-- 3. Ensure Storage Buckets Exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('artworks', 'artworks', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set creator-documents to private (only owners & admins can view CVs/proposals)
UPDATE storage.buckets SET public = false WHERE id = 'creator-documents';

-- 4. Storage Policies: Artworks Bucket
DROP POLICY IF EXISTS "Anyone can view artwork images" ON storage.objects;
CREATE POLICY "Anyone can view artwork images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'artworks');

DROP POLICY IF EXISTS "Authenticated users can upload artwork images" ON storage.objects;
CREATE POLICY "Authenticated users can upload artwork images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'artworks'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own artwork images" ON storage.objects;
CREATE POLICY "Users can update own artwork images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'artworks'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own artwork images" ON storage.objects;
CREATE POLICY "Users can delete own artwork images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'artworks'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Storage Policies: Avatars Bucket
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. Storage Policies: Private Creator Documents Bucket
DROP POLICY IF EXISTS "Public can view creator documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners and admins can view creator documents" ON storage.objects;
CREATE POLICY "Owners and admins can view creator documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'creator-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
    )
  );


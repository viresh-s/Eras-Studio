-- ============================================================================
-- ERAS Image Pipeline & Dual-Resolution Metadata Migration
-- ============================================================================
-- Description:
-- Adds database columns to support the client-side dual-resolution WebP
-- image compression pipeline.
--
-- 1. image_url_full: High-res WebP (up to 2560px) for detail view / zoom
-- 2. additional_images_full: Array of high-res WebP URLs for gallery zoom
-- 3. image_width: Original natural width in pixels
-- 4. image_height: Original natural height in pixels
-- 5. aspect_ratio: Computed aspect ratio (width / height) for layout stability
-- ============================================================================

ALTER TABLE artworks
  ADD COLUMN IF NOT EXISTS image_url_full TEXT,
  ADD COLUMN IF NOT EXISTS additional_images_full TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_width INTEGER,
  ADD COLUMN IF NOT EXISTS image_height INTEGER,
  ADD COLUMN IF NOT EXISTS aspect_ratio NUMERIC(6, 4);

-- Comment explanations
COMMENT ON COLUMN artworks.image_url IS 'Card-resolution WebP (max 1000px, ~40-80KB) for fast feed and grid rendering';
COMMENT ON COLUMN artworks.image_url_full IS 'Full-resolution WebP (max 2560px, ~150-400KB) for detail view inspection';
COMMENT ON COLUMN artworks.additional_images IS 'Card-resolution WebP URLs for secondary gallery images';
COMMENT ON COLUMN artworks.additional_images_full IS 'Full-resolution WebP URLs for secondary gallery images';
COMMENT ON COLUMN artworks.image_width IS 'Natural pixel width of the original image';
COMMENT ON COLUMN artworks.image_height IS 'Natural pixel height of the original image';
COMMENT ON COLUMN artworks.aspect_ratio IS 'Aspect ratio (width/height) to prevent layout shifts during image loading';

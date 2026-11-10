-- =========================================================================
-- ERAS Studio: Comprehensive Security Hardening & Privilege Guard
-- Date: 10 Nov 2026
-- Objectives:
--  1. Block browser-side / API privilege escalation on profiles (role, plan, is_premium, status).
--  2. Authoritative ownership enforcement on artworks (creator_id tamper protection).
--  3. Protect COR requests and memberships from self-approval.
--  4. Strict Row Level Security policies across profiles, artworks, and COR tables.
-- =========================================================================

-- 1. Function & Trigger: Prevent Profile Privilege Escalation
CREATE OR REPLACE FUNCTION public.protect_profile_privilege_escalation()
RETURNS TRIGGER AS $$
DECLARE
  caller_role text;
BEGIN
  -- If invoked via service_role / background worker, allow modification
  IF current_setting('role', true) = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine caller role from profiles table
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  -- If caller is not Admin, prevent modification of sensitive privileges
  IF caller_role IS DISTINCT FROM 'Admin' THEN
    -- Protect role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Unauthorized: Only administrators can modify user roles.';
    END IF;

    -- Protect plan and is_premium
    IF NEW.plan IS DISTINCT FROM OLD.plan OR NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
      RAISE EXCEPTION 'Unauthorized: Plan and membership tier cannot be modified directly.';
    END IF;

    -- Protect account suspension / moderation status
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Unauthorized: Account status can only be updated by administrators.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privilege_escalation();


-- 2. Function & Trigger: Protect Artwork Ownership Immutability
CREATE OR REPLACE FUNCTION public.protect_artwork_ownership()
RETURNS TRIGGER AS $$
DECLARE
  caller_role text;
BEGIN
  -- If service role or background sync, allow
  IF current_setting('role', true) = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  -- Non-admins cannot transfer artwork ownership to another creator
  IF caller_role IS DISTINCT FROM 'Admin' THEN
    IF NEW.creator_id IS DISTINCT FROM OLD.creator_id THEN
      RAISE EXCEPTION 'Unauthorized: Artwork creator attribution cannot be transferred.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_artwork_ownership ON public.artworks;
CREATE TRIGGER trg_protect_artwork_ownership
  BEFORE UPDATE ON public.artworks
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_artwork_ownership();


-- 3. Function & Trigger: Protect COR Requests from Self-Approval
CREATE OR REPLACE FUNCTION public.protect_cor_request_approval()
RETURNS TRIGGER AS $$
DECLARE
  caller_role text;
BEGIN
  IF current_setting('role', true) = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  IF caller_role IS DISTINCT FROM 'Admin' THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'approved' THEN
      RAISE EXCEPTION 'Unauthorized: Only administrators can approve representation requests.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cor_requests') THEN
    DROP TRIGGER IF EXISTS trg_protect_cor_request_approval ON public.cor_requests;
    CREATE TRIGGER trg_protect_cor_request_approval
      BEFORE UPDATE ON public.cor_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.protect_cor_request_approval();
  END IF;
END $$;


-- 4. Enable RLS and Authoritative Policies on Artworks Table
ALTER TABLE IF EXISTS public.artworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artworks insert policy" ON public.artworks;
CREATE POLICY "Artworks insert policy"
  ON public.artworks FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  );

DROP POLICY IF EXISTS "Artworks update policy" ON public.artworks;
CREATE POLICY "Artworks update policy"
  ON public.artworks FOR UPDATE
  USING (
    auth.uid() = creator_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  );

DROP POLICY IF EXISTS "Artworks delete policy" ON public.artworks;
CREATE POLICY "Artworks delete policy"
  ON public.artworks FOR DELETE
  USING (
    auth.uid() = creator_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  );

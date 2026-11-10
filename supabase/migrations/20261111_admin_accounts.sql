-- =========================================================================
-- ERAS Studio: Unified Admin Accounts & Single Active Session Migration
-- Date: 11 Nov 2026
-- Objectives:
--  1. UNIFIED SINGLE TABLE for both Admin Account Identity and Single Session Management.
--  2. Restricts Admin dashboard privileges strictly to the two predefined identities:
--     - Admin 01: admin123 (admin123@internal.eras.studio)
--     - Admin 02: admin@eras.com
--  3. Enforces single active administrator session and 30-minute inactivity timeout.
--  4. Eliminates the need for a separate admin_sessions table.
-- =========================================================================

-- Clean up any previous partial/separate tables so the unified schema is cleanly applied
DROP TABLE IF EXISTS public.admin_sessions CASCADE;
DROP TABLE IF EXISTS public.admin_accounts CASCADE;

-- Create Unified Admin Accounts Table
CREATE TABLE public.admin_accounts (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  display_name text,
  role text NOT NULL DEFAULT 'Admin',
  is_active boolean NOT NULL DEFAULT true,

  -- Authoritative Single Active Session Fields
  active_session_token_id text UNIQUE,
  session_ip_address text,
  session_user_agent_hash text,
  session_created_at timestamptz,
  session_last_activity_at timestamptz,
  session_expires_at timestamptz,
  session_is_active boolean NOT NULL DEFAULT false,
  session_revoked_at timestamptz,
  session_revocation_reason text,

  -- Record Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for instant session verification and single-session concurrency lookups
CREATE INDEX IF NOT EXISTS idx_admin_accounts_session
  ON public.admin_accounts(id, session_is_active, session_last_activity_at);

CREATE INDEX IF NOT EXISTS idx_admin_accounts_token
  ON public.admin_accounts(active_session_token_id)
  WHERE active_session_token_id IS NOT NULL;

-- Row Level Security: Admin accounts table is strictly readable by service role or authenticated admins
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin accounts access" ON public.admin_accounts;
CREATE POLICY "Admin accounts access"
  ON public.admin_accounts
  USING (
    current_setting('role', true) = 'service_role'
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  );

-- Seed the Exactly TWO Predefined Admin Identities (linked to Supabase Auth UUIDs)
INSERT INTO public.admin_accounts (
  id,
  username,
  email,
  display_name,
  role,
  is_active,
  session_is_active
)
VALUES
  (
    'd39b6c46-017a-4f75-a1d1-d1d626a00cdd',
    'admin123',
    'admin123@internal.eras.studio',
    'System Admin (01)',
    'Admin',
    true,
    false
  ),
  (
    '301aa580-9e64-4db8-af01-149685998077',
    'admin@eras.com',
    'admin@eras.com',
    'Executive Admin (02)',
    'Admin',
    true,
    false
  )
ON CONFLICT (username) DO UPDATE
SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  role = 'Admin',
  is_active = true,
  updated_at = now();

-- Automated Function to Expire Inactive Admin Sessions (> 30 minutes idle)
CREATE OR REPLACE FUNCTION public.prune_expired_admin_sessions()
RETURNS void AS $$
BEGIN
  UPDATE public.admin_accounts
  SET session_is_active = false,
      session_revoked_at = now(),
      session_revocation_reason = 'inactivity_timeout',
      updated_at = now()
  WHERE session_is_active = true
    AND session_last_activity_at < (now() - interval '30 minutes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

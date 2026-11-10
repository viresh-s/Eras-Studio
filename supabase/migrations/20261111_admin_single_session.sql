-- =========================================================================
-- ERAS Studio: Admin Single Session & 30-Minute Inactivity Migration
-- Date: 11 Nov 2026
-- Objectives:
--  1. Authoritative server-side single active Admin session tracking.
--  2. 30-minute inactivity automatic expiration and revocation.
--  3. Prevention of concurrent logins across multiple browsers or devices.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  session_token_id text NOT NULL UNIQUE,
  user_agent_hash text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  is_active boolean NOT NULL DEFAULT true,
  revoked_at timestamptz,
  revocation_reason text
);

-- Index for instant lookup of active admin session
CREATE INDEX IF NOT EXISTS idx_admin_sessions_lookup
  ON public.admin_sessions(admin_id, is_active, last_activity_at);

-- Row Level Security: Admin sessions are strictly accessible by backend service role or Admin
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin sessions service role only" ON public.admin_sessions;
CREATE POLICY "Admin sessions service role only"
  ON public.admin_sessions
  USING (
    current_setting('role', true) = 'service_role'
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  );

-- Function to prune expired inactive sessions
CREATE OR REPLACE FUNCTION public.prune_expired_admin_sessions()
RETURNS void AS $$
BEGIN
  UPDATE public.admin_sessions
  SET is_active = false,
      revoked_at = now(),
      revocation_reason = 'inactivity_timeout'
  WHERE is_active = true
    AND last_activity_at < (now() - interval '30 minutes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


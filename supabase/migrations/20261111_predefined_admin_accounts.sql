-- =========================================================================
-- ERAS Studio: Predefined Admin Accounts Migration
-- Date: 11 Nov 2026
-- Objectives:
--  1. Document and map the exactly TWO authorized Admin identities.
--  2. Restrict Admin dashboard and management privileges strictly to:
--     - Admin 01: admin123 (admin123@internal.eras.studio)
--     - Admin 02: admin@eras.com
--  3. Store passwords securely hashed in Supabase Auth (auth.users).
--  4. Prevent public self-promotion or ordinary accounts from obtaining Admin role.
-- =========================================================================

-- Ensure admin accounts table exists for authoritative server-side role verification
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  display_name text,
  role text NOT NULL DEFAULT 'Admin',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security: Admin accounts table is strictly readable by service role or authenticated admins
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin accounts access" ON public.admin_accounts;
CREATE POLICY "Admin accounts access"
  ON public.admin_accounts
  USING (
    current_setting('role', true) = 'service_role'
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'
  );

-- Predefined Admin Identities Seed (Auth IDs match Supabase Auth identities)
INSERT INTO public.admin_accounts (id, username, email, display_name, role, is_active)
VALUES
  ('d39b6c46-017a-4f75-a1d1-d1d626a00cdd', 'admin123', 'admin123@internal.eras.studio', 'System Admin (01)', 'Admin', true),
  ('301aa580-9e64-4db8-af01-149685998077', 'admin@eras.com', 'admin@eras.com', 'Executive Admin (02)', 'Admin', true)
ON CONFLICT (username) DO UPDATE
SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  role = 'Admin',
  is_active = true,
  updated_at = now();

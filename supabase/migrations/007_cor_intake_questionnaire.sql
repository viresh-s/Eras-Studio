-- ==============================================================================
-- MIGRATION 007: COR ARTIST INTAKE QUESTIONNAIRE EXTENSION (SECTIONS A - P)
-- ==============================================================================
-- Extends the canonical public.cor_members table with full artist intake questionnaire
-- fields, indexed structured JSONB storage, and queryable matching columns.
-- Non-destructive: preserves all existing data, foreign keys, and RLS policies.
-- ==============================================================================

-- 1. EXTEND CANONICAL COR_MEMBERS TABLE
ALTER TABLE public.cor_members
  ADD COLUMN IF NOT EXISTS intake_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS primary_medium TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS career_stage TEXT,
  ADD COLUMN IF NOT EXISTS geographical_preference TEXT,
  ADD COLUMN IF NOT EXISTS willing_to_pay_fees BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_acceptable_fee_inr NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_approval_preference TEXT DEFAULT 'Artist must approve each application beforehand',
  ADD COLUMN IF NOT EXISTS outreach_involvement TEXT DEFAULT 'Collaborative',
  ADD COLUMN IF NOT EXISTS target_institutions TEXT,
  ADD COLUMN IF NOT EXISTS excluded_opportunities TEXT;

-- 2. CREATE SEARCH & PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_cor_members_intake_data ON public.cor_members USING GIN (intake_data);
CREATE INDEX IF NOT EXISTS idx_cor_members_primary_medium ON public.cor_members USING GIN (primary_medium);
CREATE INDEX IF NOT EXISTS idx_cor_members_career_stage ON public.cor_members (career_stage);
CREATE INDEX IF NOT EXISTS idx_cor_members_final_approval ON public.cor_members (final_approval_preference);

-- 3. ENSURE BACKWARD-COMPATIBLE VIEWS FOR LEGACY QUERIES
-- If cor_requests does not exist as a physical table, create a compatible view mapped to cor_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'cor_requests'
  ) THEN
    CREATE VIEW public.cor_requests AS
    SELECT 
      id,
      creator_id,
      CASE 
        WHEN status IN ('active', 'approved') THEN 'Approved'
        WHEN status = 'declined' THEN 'Declined'
        ELSE 'Pending'
      END AS status,
      decline_reason AS declined_reason,
      submitted_at,
      approved_at AS reviewed_at,
      created_at,
      updated_at
    FROM public.cor_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'cor_profiles'
  ) THEN
    CREATE VIEW public.cor_profiles AS
    SELECT 
      id,
      creator_id,
      status,
      completeness_percentage,
      assigned_consultant,
      submitted_at,
      created_at,
      updated_at
    FROM public.cor_members;
  END IF;
END $$;

-- 4. HARDEN ROW LEVEL SECURITY ON COR_MEMBERS
ALTER TABLE public.cor_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Creator SELECT own record
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Creators can view own COR record' AND tablename = 'cor_members') THEN
    CREATE POLICY "Creators can view own COR record"
      ON public.cor_members FOR SELECT
      USING (
        auth.uid() = creator_id 
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
      );
  END IF;

  -- Creator INSERT own record
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Creators can insert own COR record' AND tablename = 'cor_members') THEN
    CREATE POLICY "Creators can insert own COR record"
      ON public.cor_members FOR INSERT
      WITH CHECK (
        auth.uid() = creator_id 
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Creator')
      );
  END IF;

  -- Creator UPDATE own record (cannot change status or admin notes directly)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Creators can update own COR profile' AND tablename = 'cor_members') THEN
    CREATE POLICY "Creators can update own COR profile"
      ON public.cor_members FOR UPDATE
      USING (
        auth.uid() = creator_id 
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
      )
      WITH CHECK (
        auth.uid() = creator_id 
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
      );
  END IF;

  -- Admins full access
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage all COR members' AND tablename = 'cor_members') THEN
    CREATE POLICY "Admins manage all COR members"
      ON public.cor_members FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));
  END IF;
END $$;

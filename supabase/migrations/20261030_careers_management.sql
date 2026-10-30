-- =============================================
-- Eras Studio: Careers Feature Database Migration
-- Exactly Two Tables:
-- 1. career_opportunities
-- 2. career_applications
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE 1: career_opportunities
-- Purpose: Store career opportunities created by the admin
-- =============================================
CREATE TABLE IF NOT EXISTS public.career_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  location TEXT NOT NULL,
  work_mode TEXT NOT NULL DEFAULT 'Remote',
  description TEXT NOT NULL,
  responsibilities TEXT,
  requirements TEXT,
  experience TEXT,
  application_deadline TIMESTAMPTZ,
  openings INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE 2: career_applications
-- Purpose: Store candidate applications and track their progress
-- =============================================
CREATE TABLE IF NOT EXISTS public.career_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.career_opportunities(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  portfolio_url TEXT,
  linkedin_url TEXT,
  cover_letter TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected')),
  admin_notes TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES for Performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_career_opps_status ON public.career_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_career_opps_created_at ON public.career_opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_opps_department ON public.career_opportunities(department);

CREATE INDEX IF NOT EXISTS idx_career_apps_opp_id ON public.career_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_career_apps_status ON public.career_applications(status);
CREATE INDEX IF NOT EXISTS idx_career_apps_email ON public.career_applications(email);
CREATE INDEX IF NOT EXISTS idx_career_apps_applied_at ON public.career_applications(applied_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE public.career_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------
-- Policies for career_opportunities
-- ---------------------------------------------

-- Public can read ONLY published opportunities
DROP POLICY IF EXISTS "Public can view published career opportunities" ON public.career_opportunities;
CREATE POLICY "Public can view published career opportunities"
  ON public.career_opportunities FOR SELECT
  USING (status = 'published');

-- Admins can view ALL opportunities (draft, published, closed)
DROP POLICY IF EXISTS "Admins can view all career opportunities" ON public.career_opportunities;
CREATE POLICY "Admins can view all career opportunities"
  ON public.career_opportunities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Admins can insert opportunities
DROP POLICY IF EXISTS "Admins can insert career opportunities" ON public.career_opportunities;
CREATE POLICY "Admins can insert career opportunities"
  ON public.career_opportunities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Admins can update opportunities
DROP POLICY IF EXISTS "Admins can update career opportunities" ON public.career_opportunities;
CREATE POLICY "Admins can update career opportunities"
  ON public.career_opportunities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Admins can delete opportunities
DROP POLICY IF EXISTS "Admins can delete career opportunities" ON public.career_opportunities;
CREATE POLICY "Admins can delete career opportunities"
  ON public.career_opportunities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- ---------------------------------------------
-- Policies for career_applications
-- ---------------------------------------------

-- Candidates can submit an application ONLY to a published opportunity
DROP POLICY IF EXISTS "Candidates can submit applications to published opportunities" ON public.career_applications;
CREATE POLICY "Candidates can submit applications to published opportunities"
  ON public.career_applications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.career_opportunities
      WHERE id = opportunity_id AND status = 'published'
    )
  );

-- Admins can view all applications
DROP POLICY IF EXISTS "Admins can view all career applications" ON public.career_applications;
CREATE POLICY "Admins can view all career applications"
  ON public.career_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Admins can update applications (status, internal notes)
DROP POLICY IF EXISTS "Admins can update career applications" ON public.career_applications;
CREATE POLICY "Admins can update career applications"
  ON public.career_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Admins can delete applications
DROP POLICY IF EXISTS "Admins can delete career applications" ON public.career_applications;
CREATE POLICY "Admins can delete career applications"
  ON public.career_applications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );


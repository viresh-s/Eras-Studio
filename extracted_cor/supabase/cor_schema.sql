-- ===================================================
-- COR PRO DATABASE SCHEMA FOR ERAS STUDIO
-- Run this in Supabase SQL Editor
-- ===================================================

-- 1. COR PROFILES
CREATE TABLE IF NOT EXISTS public.cor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'active', 'paused')),
  completeness_percentage INTEGER DEFAULT 0,
  assigned_consultant TEXT DEFAULT 'Priya Nair',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own COR profile"
  ON public.cor_profiles FOR SELECT
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

CREATE POLICY "Creators can insert own COR profile"
  ON public.cor_profiles FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own COR profile"
  ON public.cor_profiles FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- 1B. COR REQUESTS (Creator-submitted membership requests)
CREATE TABLE IF NOT EXISTS public.cor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Declined')),
  declined_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cor_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own COR request"
  ON public.cor_requests FOR SELECT
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

CREATE POLICY "Creators can insert own COR request"
  ON public.cor_requests FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own COR request"
  ON public.cor_requests FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- 1C. COR MEMBERS (Approved active COR members)
CREATE TABLE IF NOT EXISTS public.cor_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Completed', 'Removed')),
  assigned_consultant TEXT DEFAULT 'Priya Nair',
  approved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cor_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own COR membership"
  ON public.cor_members FOR SELECT
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

CREATE POLICY "Admins manage COR members"
  ON public.cor_members FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

-- 2. COR CAREER INFORMATION
CREATE TABLE IF NOT EXISTS public.cor_career_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  "current_role" TEXT,
  current_company TEXT,
  years_of_experience TEXT,
  professional_category TEXT,
  career_level TEXT,
  employment_status TEXT,
  preferred_roles TEXT[] DEFAULT '{}',
  preferred_industries TEXT[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  remote_preference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cor_career_information ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own career info"
  ON public.cor_career_information FOR ALL
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'))
  WITH CHECK (auth.uid() = creator_id);

-- 3. COR SKILLS
CREATE TABLE IF NOT EXISTS public.cor_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  primary_skills TEXT[] DEFAULT '{}',
  secondary_skills TEXT[] DEFAULT '{}',
  software TEXT[] DEFAULT '{}',
  tools TEXT[] DEFAULT '{}',
  specialization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cor_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own skills"
  ON public.cor_skills FOR ALL
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'))
  WITH CHECK (auth.uid() = creator_id);

-- 4. COR EDUCATION
CREATE TABLE IF NOT EXISTS public.cor_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  institute TEXT NOT NULL,
  year TEXT,
  additional_education TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cor_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own education"
  ON public.cor_education FOR ALL
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'))
  WITH CHECK (auth.uid() = creator_id);

-- 5. COR EXPERIENCE
CREATE TABLE IF NOT EXISTS public.cor_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  duration TEXT,
  start_date TEXT,
  end_date TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  responsibilities TEXT,
  achievements TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cor_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own experience"
  ON public.cor_experience FOR ALL
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'))
  WITH CHECK (auth.uid() = creator_id);

-- 6. COR PROFESSIONAL LINKS
CREATE TABLE IF NOT EXISTS public.cor_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  portfolio_url TEXT,
  behance_url TEXT,
  dribbble_url TEXT,
  linkedin_url TEXT,
  personal_website TEXT,
  instagram_url TEXT,
  github_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cor_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own links"
  ON public.cor_links FOR ALL
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'))
  WITH CHECK (auth.uid() = creator_id);

-- 7. COR DOCUMENTS
CREATE TABLE IF NOT EXISTS public.cor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('cv', 'resume', 'portfolio_pdf', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cor_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own documents"
  ON public.cor_documents FOR ALL
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'))
  WITH CHECK (auth.uid() = creator_id);

-- 8. COR CAREER GOALS
CREATE TABLE IF NOT EXISTS public.cor_career_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  expected_salary TEXT,
  current_salary TEXT,
  salary_currency TEXT DEFAULT 'INR',
  salary_privacy TEXT DEFAULT 'confidential',
  career_goal TEXT,
  desired_role TEXT,
  opportunity_type TEXT,
  freelance_preference TEXT,
  full_time_preference TEXT,
  additional_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cor_career_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own career goals"
  ON public.cor_career_goals FOR ALL
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'))
  WITH CHECK (auth.uid() = creator_id);

-- 9. COR OPPORTUNITIES
CREATE TABLE IF NOT EXISTS public.cor_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  workplace_type TEXT NOT NULL DEFAULT 'Hybrid' CHECK (workplace_type IN ('Remote', 'Hybrid', 'Onsite', 'Flexible')),
  salary_range TEXT,
  skills TEXT[] DEFAULT '{}',
  description TEXT,
  requirements TEXT,
  external_url TEXT,
  recruiter_contact TEXT,
  is_curated BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cor_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone with authenticated account can view open opportunities"
  ON public.cor_opportunities FOR SELECT
  USING (status = 'open');

CREATE POLICY "Admins manage opportunities"
  ON public.cor_opportunities FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

-- 10. COR APPLICATIONS
CREATE TABLE IF NOT EXISTS public.cor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.cor_opportunities(id) ON DELETE CASCADE,
  current_stage TEXT NOT NULL DEFAULT 'Preparing Application' CHECK (current_stage IN (
    'Recommended',
    'Preparing Application',
    'Applied',
    'Screening',
    'Interview',
    'Final Round',
    'Offer',
    'Rejected'
  )),
  applied_date TIMESTAMPTZ,
  interview_date TIMESTAMPTZ,
  creator_notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, opportunity_id)
);

ALTER TABLE public.cor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view own applications"
  ON public.cor_applications FOR SELECT
  USING (auth.uid() = candidate_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

CREATE POLICY "Candidates can create own applications"
  ON public.cor_applications FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates and Admins can update applications"
  ON public.cor_applications FOR UPDATE
  USING (auth.uid() = candidate_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

-- 11. COR APPLICATION EVENTS
CREATE TABLE IF NOT EXISTS public.cor_application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.cor_applications(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cor_application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view events for own applications"
  ON public.cor_application_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cor_applications
      WHERE id = cor_application_events.application_id
      AND (candidate_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'))
    )
  );

CREATE POLICY "System and Admins can insert application events"
  ON public.cor_application_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cor_applications
      WHERE id = cor_application_events.application_id
      AND (candidate_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'))
    )
  );

-- 12. COR CONSULTATIONS
CREATE TABLE IF NOT EXISTS public.cor_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consultant_name TEXT NOT NULL DEFAULT 'Priya Nair',
  slot_time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  meeting_url TEXT,
  creator_notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cor_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own consultations"
  ON public.cor_consultations FOR SELECT
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

CREATE POLICY "Creators can book consultations"
  ON public.cor_consultations FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own consultations"
  ON public.cor_consultations FOR UPDATE
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

-- 13. COR ACTIVITIES
CREATE TABLE IF NOT EXISTS public.cor_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cor_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own COR activities"
  ON public.cor_activities FOR SELECT
  USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

CREATE POLICY "Creators can insert own COR activities"
  ON public.cor_activities FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- 14. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_cor_profiles_creator_id ON public.cor_profiles(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_requests_creator_id ON public.cor_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_members_creator_id ON public.cor_members(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_career_creator_id ON public.cor_career_information(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_skills_creator_id ON public.cor_skills(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_education_creator_id ON public.cor_education(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_experience_creator_id ON public.cor_experience(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_links_creator_id ON public.cor_links(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_documents_creator_id ON public.cor_documents(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_goals_creator_id ON public.cor_career_goals(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_opportunities_status ON public.cor_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_cor_applications_candidate_id ON public.cor_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_cor_applications_opp_id ON public.cor_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_cor_consultations_creator_id ON public.cor_consultations(creator_id);
CREATE INDEX IF NOT EXISTS idx_cor_activities_creator_id ON public.cor_activities(creator_id);

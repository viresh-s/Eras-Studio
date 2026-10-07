export type CorProfileStatus = 'draft' | 'under_review' | 'active' | 'paused';

export type CorWorkplaceType = 'Remote' | 'Hybrid' | 'Onsite' | 'Flexible';

export type CorApplicationStage =
  | 'Recommended'
  | 'Preparing Application'
  | 'Applied'
  | 'Screening'
  | 'Interview'
  | 'Final Round'
  | 'Offer'
  | 'Rejected';

export const COR_APPLICATION_STAGES: CorApplicationStage[] = [
  'Recommended',
  'Preparing Application',
  'Applied',
  'Screening',
  'Interview',
  'Final Round',
  'Offer',
  'Rejected',
];

export interface CorProfile {
  id: string;
  creator_id: string;
  status: CorProfileStatus;
  completeness_percentage: number;
  assigned_consultant: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CorCareerInformation {
  id?: string;
  creator_id: string;
  current_role: string;
  current_company: string;
  years_of_experience: string;
  professional_category: string;
  career_level: string;
  employment_status: string;
  preferred_roles: string[];
  preferred_industries: string[];
  preferred_locations: string[];
  remote_preference: string;
  created_at?: string;
  updated_at?: string;
}

export interface CorSkills {
  id?: string;
  creator_id: string;
  primary_skills: string[];
  secondary_skills: string[];
  software: string[];
  tools: string[];
  specialization: string;
  created_at?: string;
  updated_at?: string;
}

export interface CorEducation {
  id: string;
  creator_id: string;
  degree: string;
  institute: string;
  year: string;
  additional_education?: string | null;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CorExperience {
  id: string;
  creator_id: string;
  company: string;
  role: string;
  duration?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  responsibilities: string;
  achievements?: string | null;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CorLinks {
  id?: string;
  creator_id: string;
  portfolio_url: string;
  behance_url: string;
  dribbble_url: string;
  linkedin_url: string;
  personal_website: string;
  instagram_url: string;
  github_url: string;
  created_at?: string;
  updated_at?: string;
}

export interface CorDocument {
  id: string;
  creator_id: string;
  doc_type: 'cv' | 'resume' | 'portfolio_pdf' | 'other';
  file_name: string;
  file_url: string;
  storage_path: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

export interface CorCareerGoals {
  id?: string;
  creator_id: string;
  expected_salary: string;
  current_salary: string;
  salary_currency: string;
  salary_privacy: 'confidential' | 'shared_with_curators';
  career_goal: string;
  desired_role: string;
  opportunity_type: string;
  freelance_preference: string;
  full_time_preference: string;
  additional_notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface CorFullProfile {
  profile: CorProfile;
  personal: {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    date_of_birth?: string;
    avatar_url?: string;
    bio?: string;
  };
  career: CorCareerInformation;
  skills: CorSkills;
  education: CorEducation[];
  experience: CorExperience[];
  links: CorLinks;
  documents: CorDocument[];
  goals: CorCareerGoals;
}

export interface CorOpportunity {
  id: string;
  job_id?: string | null;
  role: string;
  company: string;
  location: string;
  workplace_type: CorWorkplaceType;
  salary_range: string;
  skills: string[];
  description: string;
  requirements?: string | null;
  external_url?: string | null;
  recruiter_contact?: string | null;
  is_curated: boolean;
  status: 'open' | 'closed';
  created_at: string;
  // Computed matching tags (rule-based)
  match_reasons?: string[];
  is_matched?: boolean;
}

export interface CorApplication {
  id: string;
  candidate_id: string;
  opportunity_id: string;
  current_stage: CorApplicationStage;
  applied_date: string | null;
  interview_date: string | null;
  creator_notes: string | null;
  created_at: string;
  updated_at: string;
  opportunity?: CorOpportunity;
}

export interface CorApplicationEvent {
  id: string;
  application_id: string;
  stage: CorApplicationStage | string;
  title: string;
  note: string | null;
  created_at: string;
}

export interface CorConsultation {
  id: string;
  creator_id: string;
  consultant_name: string;
  slot_time: string;
  duration_minutes: number;
  purpose: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_url?: string | null;
  creator_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CorActivity {
  id: string;
  creator_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  created_at: string;
}

export type CorRequestStatus = 'NotSubmitted' | 'Pending' | 'Approved' | 'Declined';
export type CorMemberStatus = 'Active' | 'Paused' | 'Completed' | 'Removed';

export interface CorRequest {
  id: string;
  creator_id: string;
  status: 'Pending' | 'Approved' | 'Declined';
  declined_reason?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CorMember {
  id: string;
  creator_id: string;
  status: CorMemberStatus;
  assigned_consultant: string;
  approved_at: string;
  created_at: string;
  updated_at: string;
}

export interface CorDashboardData {
  requestStatus: CorRequestStatus;
  memberStatus: CorMemberStatus | null;
  declinedReason: string | null;
  submittedAt: string | null;
  profile: CorProfile | null;
  fullProfile: CorFullProfile | null;
  pipelineCounts: Record<CorApplicationStage, number>;
  metrics: {
    opportunitiesFound: number;
    applicationsSubmitted: number;
    interviews: number;
    offers: number;
  };
  upcomingConsultation: CorConsultation | null;
  recentOpportunities: CorOpportunity[];
  recentActivities: CorActivity[];
  recentApplications: CorApplication[];
}


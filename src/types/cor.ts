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

export interface ArtistIntakeQuestionnaire {
  // A. Personal Details
  personal: {
    full_name: string;
    pen_name?: string;
    primary_phone: string;
    secondary_phone?: string;
    primary_email: string;
    secondary_email?: string;
    date_of_birth: string;
  };
  // B. Artistic Practice
  artistic_practice: {
    primary_medium: string[];
    custom_medium?: string;
    paper_painting_medium?: string[];
    canvas_painting_medium?: string[];
    sculpture_medium?: string[];
    digital_art_software?: string[];
  };
  // C. Geography and Location
  geography: {
    geographical_preference: 'Home State' | 'Pan-India' | 'Other';
    home_state: string;
    city_town: string;
    studio_address: string;
  };
  // D. Career History
  career_history: {
    practicing_since_year: string;
    group_exhibitions_count: number;
    solo_exhibitions_count: number;
    career_stage: 'Emerging' | 'Early Career' | 'Mid-Career' | 'Established' | 'Other';
    important_exhibitions: string;
    gallery_representation: 'Yes' | 'No' | 'Other';
    represented_galleries?: string;
    previous_residencies: string;
  };
  // E. Digital Presence
  digital_presence: {
    website_url?: string;
    instagram_handle?: string;
    linkedin_handle?: string;
    x_handle?: string;
    facebook_handle?: string;
  };
  // F. Significant Platforms
  significant_platforms: {
    platforms: string[];
    custom_platform?: string;
    platform_details: Record<string, { names: string; description: string }>;
  };
  // G. Awards, Funding and Recognition
  awards_recognition: {
    has_funding_awards: 'Yes' | 'No';
    funding_details?: string;
    has_press_publications: 'Yes' | 'No';
    press_details?: string;
  };
  // H. Artist Goals and Funding Priorities
  goals_priorities: {
    priorities: string[];
    custom_priority?: string;
    intended_use_of_funds: string;
    dream_project: string;
    current_proposal: string;
  };
  // I. International Mobility
  mobility: {
    willingness: 'Flexible' | 'Not-flexible' | 'Other';
    excluded_countries?: string;
    relocate_temporarily: 'Yes' | 'No' | 'Depends on location/opportunity';
    max_residency_duration: 'Under 1 month' | '1–3 months' | '3–6 months' | '6–12 months' | '1 year+';
    international_travel_ability: 'Yes' | 'No' | 'Depends on visa/funding';
    passport_status: 'Yes' | 'No' | 'Expires soon';
    passport_expiry_date?: string;
    travel_restrictions?: string;
  };
  // J. Target Opportunities and Exclusions
  target_opportunities: {
    target_institutions: string;
    excluded_opportunities: string;
    exclusion_reasons: string;
  };
  // K. Facilities and Resources
  facilities: {
    selected_facilities: string[];
    custom_facilities?: string;
  };
  // L. Application Fees and Financial Circumstances
  financial: {
    willing_to_pay_fees: 'Yes' | 'No';
    max_acceptable_fee_inr: number;
    employment_status: 'Yes' | 'No' | 'Part-time' | 'Other';
    circumstances_notes?: string;
  };
  // M. Participation Preferences
  participation: {
    preferred_activities: string[];
    excluded_activities?: string;
  };
  // N. Previous Applications
  previous_applications: {
    has_applied: 'Yes' | 'No';
    application_names?: string;
    was_successful?: 'Yes' | 'No' | 'Other';
  };
  // O. Application Representation and Restrictions
  representation_restrictions: {
    de_emphasize_details?: string;
    never_claim_statements?: string;
    additional_info?: string;
  };
  // P. Outreach and Approval Preferences
  approval_preferences: {
    outreach_involvement: 'Hands-off' | 'Collaborative' | 'Highly involved' | 'Other';
    response_time: string;
    final_approval_preference: 'Admin team can apply without prior approval and provide updates every 10 days' | 'Artist must approve each application beforehand';
  };
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
  intake?: ArtistIntakeQuestionnaire;
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


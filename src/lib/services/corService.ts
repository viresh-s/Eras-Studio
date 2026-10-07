import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';
import type {
  CorProfile,
  CorFullProfile,
  CorCareerInformation,
  CorSkills,
  CorEducation,
  CorExperience,
  CorLinks,
  CorDocument,
  CorCareerGoals,
  CorOpportunity,
  CorApplication,
  CorApplicationEvent,
  CorConsultation,
  CorActivity,
  CorDashboardData,
  CorApplicationStage,
  CorRequestStatus,
  CorMemberStatus,
} from '@/types/cor';
import { COR_APPLICATION_STAGES } from '@/types/cor';

const DEFAULT_CONSULTANT = 'Priya Nair';

/**
 * Calculates rule-based match score and transparent explanation tags
 */
export function calculateMatchReasons(
  opportunity: CorOpportunity,
  profile: Partial<CorFullProfile> | null
): { match_reasons: string[]; is_matched: boolean } {
  const reasons: string[] = [];

  if (!profile) {
    return { match_reasons: ['Open Curatorial Call'], is_matched: false };
  }

  const userSkills = [
    ...(profile.skills?.primary_skills || []),
    ...(profile.skills?.secondary_skills || []),
    ...(profile.skills?.software || []),
    ...(profile.skills?.tools || []),
  ].map((s) => s.toLowerCase().trim());

  // 1. Skill overlap check
  if (opportunity.skills && opportunity.skills.length > 0) {
    const matchedSkills = opportunity.skills.filter((skill) =>
      userSkills.some((us) => us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us))
    );
    if (matchedSkills.length > 0) {
      reasons.push(`Matches your skills (${matchedSkills.slice(0, 2).join(', ')})`);
    }
  }

  // 2. Role preference check
  const preferredRoles = [
    profile.career?.current_role,
    ...(profile.career?.preferred_roles || []),
    profile.goals?.desired_role,
  ]
    .filter(Boolean)
    .map((r) => r!.toLowerCase().trim());

  if (preferredRoles.some((pr) => opportunity.role.toLowerCase().includes(pr) || pr.includes(opportunity.role.toLowerCase()))) {
    reasons.push('Matches your preferred role');
  }

  // 3. Location preference check
  const userLocations = [
    profile.personal?.location,
    ...(profile.career?.preferred_locations || []),
  ]
    .filter(Boolean)
    .map((l) => l!.toLowerCase().trim());

  if (
    opportunity.workplace_type === 'Remote' ||
    userLocations.some((ul) => opportunity.location.toLowerCase().includes(ul) || ul.includes(opportunity.location.toLowerCase()))
  ) {
    reasons.push(opportunity.workplace_type === 'Remote' ? 'Matches remote preference' : 'Matches location preference');
  }

  // Fallback reason if none matched
  if (reasons.length === 0) {
    reasons.push('Curated for your creative background');
  }

  return {
    match_reasons: reasons,
    is_matched: reasons.length >= 2,
  };
}

/**
 * Computes profile completeness percentage (0-100) across 8 sections
 */
export function computeProfileCompleteness(fullProfile: Partial<CorFullProfile>): number {
  let score = 0;
  // 1. Personal (20%)
  if (fullProfile.personal?.full_name && fullProfile.personal?.email) score += 15;
  if (fullProfile.personal?.location || fullProfile.personal?.phone) score += 5;

  // 2. Career (15%)
  if (fullProfile.career?.current_role) score += 10;
  if (fullProfile.career?.years_of_experience) score += 5;

  // 3. Skills (15%)
  if (fullProfile.skills?.primary_skills && fullProfile.skills.primary_skills.length > 0) score += 15;

  // 4. Education (10%)
  if (fullProfile.education && fullProfile.education.length > 0) score += 10;

  // 5. Experience (15%)
  if (fullProfile.experience && fullProfile.experience.length > 0) score += 15;

  // 6. Links (10%)
  if (fullProfile.links?.portfolio_url || fullProfile.links?.linkedin_url) score += 10;

  // 7. Documents (5%)
  if (fullProfile.documents && fullProfile.documents.length > 0) score += 5;

  // 8. Goals (10%)
  if (fullProfile.goals?.desired_role || fullProfile.goals?.career_goal) score += 10;

  return Math.min(100, score);
}

/**
 * Service to manage COR Profile, Applications, Consultations, and Discovery
 */
export class CorService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Fetches the complete COR Profile, pre-populating with existing creator profile data
   */
  async getFullProfile(creatorId: string): Promise<CorFullProfile> {
    // 1. Fetch base creator profile from `profiles`
    const { data: baseProfile } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', creatorId)
      .single();

    // 2. Attempt fetching from normalized COR tables
    let corProfile: CorProfile | null = null;
    let careerInfo: CorCareerInformation | null = null;
    let skills: CorSkills | null = null;
    let education: CorEducation[] = [];
    let experience: CorExperience[] = [];
    let links: CorLinks | null = null;
    let documents: CorDocument[] = [];
    let goals: CorCareerGoals | null = null;

    try {
      const { data: cp } = await this.supabase
        .from('cor_profiles')
        .select('*')
        .eq('creator_id', creatorId)
        .maybeSingle();
      if (cp) corProfile = cp;
    } catch {
      // Table may not exist yet in DB
    }

    try {
      const { data: ci } = await this.supabase
        .from('cor_career_information')
        .select('*')
        .eq('creator_id', creatorId)
        .maybeSingle();
      if (ci) careerInfo = ci;
    } catch {}

    try {
      const { data: sk } = await this.supabase
        .from('cor_skills')
        .select('*')
        .eq('creator_id', creatorId)
        .maybeSingle();
      if (sk) skills = sk;
    } catch {}

    try {
      const { data: edu } = await this.supabase
        .from('cor_education')
        .select('*')
        .eq('creator_id', creatorId)
        .order('display_order', { ascending: true });
      if (edu) education = edu;
    } catch {}

    try {
      const { data: exp } = await this.supabase
        .from('cor_experience')
        .select('*')
        .eq('creator_id', creatorId)
        .order('display_order', { ascending: true });
      if (exp) experience = exp;
    } catch {}

    try {
      const { data: lnk } = await this.supabase
        .from('cor_links')
        .select('*')
        .eq('creator_id', creatorId)
        .maybeSingle();
      if (lnk) links = lnk;
    } catch {}

    try {
      const { data: docs } = await this.supabase
        .from('cor_documents')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });
      if (docs) documents = docs;
    } catch {}

    try {
      const { data: gls } = await this.supabase
        .from('cor_career_goals')
        .select('*')
        .eq('creator_id', creatorId)
        .maybeSingle();
      if (gls) goals = gls;
    } catch {}

    // Resilient fallback to user metadata if tables are empty/migrating
    const metaSocial = baseProfile?.social_links || {};
    const fallbackLocation = [baseProfile?.location_city, baseProfile?.location_country].filter(Boolean).join(', ');

    const resolvedPersonal = {
      full_name: baseProfile?.full_name || '',
      email: baseProfile?.email || '',
      phone: baseProfile?.phone_number || '',
      location: fallbackLocation || '',
      bio: baseProfile?.about_me || baseProfile?.artist_statement || '',
      avatar_url: baseProfile?.profile_pic_url || '',
    };

    const resolvedLinks: CorLinks = links || {
      creator_id: creatorId,
      portfolio_url: baseProfile?.portfolio_url || '',
      behance_url: metaSocial.behance || '',
      dribbble_url: metaSocial.dribbble || '',
      linkedin_url: metaSocial.linkedin || '',
      personal_website: metaSocial.website || '',
      instagram_url: metaSocial.instagram || '',
      github_url: metaSocial.github || '',
    };

    const resolvedCareer: CorCareerInformation = careerInfo || {
      creator_id: creatorId,
      current_role: baseProfile?.primary_medium ? `${baseProfile.primary_medium} Artist` : '',
      current_company: '',
      years_of_experience: '3+ years',
      professional_category: 'Visual & Digital Arts',
      career_level: 'Mid-Level',
      employment_status: 'Freelance / Independent',
      preferred_roles: baseProfile?.art_forms ? baseProfile.art_forms.split(',').map((s: string) => s.trim()) : [],
      preferred_industries: ['Contemporary Art', 'Gallery Exhibitions', 'Institutional Commissions'],
      preferred_locations: fallbackLocation ? [fallbackLocation] : [],
      remote_preference: 'Hybrid',
    };

    const resolvedSkills: CorSkills = skills || {
      creator_id: creatorId,
      primary_skills: baseProfile?.primary_medium ? [baseProfile.primary_medium] : ['Contemporary Practice'],
      secondary_skills: ['Exhibition Design', 'Creative Direction'],
      software: ['Photoshop', 'Procreate', 'Blender'],
      tools: ['Studio Tools', 'Archival Printing'],
      specialization: baseProfile?.art_forms || 'Fine Art & Visual Expression',
    };

    const resolvedGoals: CorCareerGoals = goals || {
      creator_id: creatorId,
      expected_salary: 'Competitive / Industry Standard',
      current_salary: '',
      salary_currency: 'INR',
      salary_privacy: 'confidential',
      career_goal: 'Securing institutional gallery representation, international residency programs, and selective curatorial commissions.',
      desired_role: 'Lead Visual Artist / Resident Creator',
      opportunity_type: 'Full-time / High-value Residency',
      freelance_preference: 'Yes',
      full_time_preference: 'Open to either',
      additional_notes: '',
    };

    const profileEntity: CorProfile = corProfile || {
      id: creatorId,
      creator_id: creatorId,
      status: 'draft',
      completeness_percentage: 0,
      assigned_consultant: DEFAULT_CONSULTANT,
      submitted_at: null,
      created_at: baseProfile?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const full: CorFullProfile = {
      profile: profileEntity,
      personal: resolvedPersonal,
      career: resolvedCareer,
      skills: resolvedSkills,
      education,
      experience,
      links: resolvedLinks,
      documents,
      goals: resolvedGoals,
    };

    full.profile.completeness_percentage = computeProfileCompleteness(full);

    return full;
  }

  /**
   * Saves individual step data during onboarding or profile editing
   */
  async saveStep(creatorId: string, stepIndex: number, stepPayload: any): Promise<{ success: boolean; completeness: number }> {
    // Ensure base cor_profile exists
    try {
      await this.supabase.from('cor_profiles').upsert(
        {
          creator_id: creatorId,
          assigned_consultant: DEFAULT_CONSULTANT,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'creator_id' }
      );
    } catch {}

    switch (stepIndex) {
      case 0: {
        // Personal Information -> update profiles table as well to keep in sync
        const { full_name, phone, location, bio } = stepPayload;
        await this.supabase
          .from('profiles')
          .update({
            full_name: full_name?.trim(),
            phone_number: phone?.trim(),
            location_city: location?.trim(),
            about_me: bio?.trim(),
          })
          .eq('id', creatorId);
        break;
      }
      case 1: {
        // Career Information
        await this.supabase.from('cor_career_information').upsert(
          {
            creator_id: creatorId,
            current_role: stepPayload.current_role,
            current_company: stepPayload.current_company,
            years_of_experience: stepPayload.years_of_experience,
            professional_category: stepPayload.professional_category,
            career_level: stepPayload.career_level,
            employment_status: stepPayload.employment_status,
            preferred_roles: Array.isArray(stepPayload.preferred_roles) ? stepPayload.preferred_roles : [],
            preferred_industries: Array.isArray(stepPayload.preferred_industries) ? stepPayload.preferred_industries : [],
            preferred_locations: Array.isArray(stepPayload.preferred_locations) ? stepPayload.preferred_locations : [],
            remote_preference: stepPayload.remote_preference || 'Hybrid',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'creator_id' }
        );
        break;
      }
      case 2: {
        // Skills
        await this.supabase.from('cor_skills').upsert(
          {
            creator_id: creatorId,
            primary_skills: Array.isArray(stepPayload.primary_skills) ? stepPayload.primary_skills : [],
            secondary_skills: Array.isArray(stepPayload.secondary_skills) ? stepPayload.secondary_skills : [],
            software: Array.isArray(stepPayload.software) ? stepPayload.software : [],
            tools: Array.isArray(stepPayload.tools) ? stepPayload.tools : [],
            specialization: stepPayload.specialization,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'creator_id' }
        );
        break;
      }
      case 3: {
        // Education (replace list)
        if (Array.isArray(stepPayload.education)) {
          await this.supabase.from('cor_education').delete().eq('creator_id', creatorId);
          if (stepPayload.education.length > 0) {
            const records = stepPayload.education.map((item: any, idx: number) => ({
              creator_id: creatorId,
              degree: item.degree,
              institute: item.institute,
              year: item.year,
              additional_education: item.additional_education,
              display_order: idx,
            }));
            await this.supabase.from('cor_education').insert(records);
          }
        }
        break;
      }
      case 4: {
        // Experience (replace list)
        if (Array.isArray(stepPayload.experience)) {
          await this.supabase.from('cor_experience').delete().eq('creator_id', creatorId);
          if (stepPayload.experience.length > 0) {
            const records = stepPayload.experience.map((item: any, idx: number) => ({
              creator_id: creatorId,
              company: item.company,
              role: item.role,
              duration: item.duration,
              start_date: item.start_date,
              end_date: item.end_date,
              is_current: !!item.is_current,
              responsibilities: item.responsibilities || '',
              achievements: item.achievements || '',
              display_order: idx,
            }));
            await this.supabase.from('cor_experience').insert(records);
          }
        }
        break;
      }
      case 5: {
        // Professional Links
        await this.supabase.from('cor_links').upsert(
          {
            creator_id: creatorId,
            portfolio_url: stepPayload.portfolio_url,
            behance_url: stepPayload.behance_url,
            dribbble_url: stepPayload.dribbble_url,
            linkedin_url: stepPayload.linkedin_url,
            personal_website: stepPayload.personal_website,
            instagram_url: stepPayload.instagram_url,
            github_url: stepPayload.github_url,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'creator_id' }
        );
        // Also update portfolio_url on base profile
        if (stepPayload.portfolio_url) {
          await this.supabase
            .from('profiles')
            .update({ portfolio_url: stepPayload.portfolio_url })
            .eq('id', creatorId);
        }
        break;
      }
      case 6: {
        // Documents
        if (stepPayload.documents && Array.isArray(stepPayload.documents)) {
          // Documents are upserted or handled via file upload action
        }
        break;
      }
      case 7: {
        // Career Goals
        await this.supabase.from('cor_career_goals').upsert(
          {
            creator_id: creatorId,
            expected_salary: stepPayload.expected_salary,
            current_salary: stepPayload.current_salary,
            salary_currency: stepPayload.salary_currency || 'INR',
            salary_privacy: stepPayload.salary_privacy || 'confidential',
            career_goal: stepPayload.career_goal,
            desired_role: stepPayload.desired_role,
            opportunity_type: stepPayload.opportunity_type,
            freelance_preference: stepPayload.freelance_preference,
            full_time_preference: stepPayload.full_time_preference,
            additional_notes: stepPayload.additional_notes,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'creator_id' }
        );
        break;
      }
    }

    const updatedProfile = await this.getFullProfile(creatorId);
    const completeness = updatedProfile.profile.completeness_percentage;

    try {
      await this.supabase
        .from('cor_profiles')
        .update({ completeness_percentage: completeness, updated_at: new Date().toISOString() })
        .eq('creator_id', creatorId);
    } catch {}

    return { success: true, completeness };
  }

  /**
   * Final submission of Career Profile questionnaire
   */
  async submitCareerProfile(creatorId: string): Promise<CorProfile> {
    const now = new Date().toISOString();

    const { data: updated, error } = await this.supabase
      .from('cor_profiles')
      .upsert(
        {
          creator_id: creatorId,
          status: 'under_review',
          completeness_percentage: 100,
          assigned_consultant: DEFAULT_CONSULTANT,
          submitted_at: now,
          updated_at: now,
        },
        { onConflict: 'creator_id' }
      )
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('submitCareerProfile fallback warning:', error.message);
    }

    // Log Activity
    await this.logActivity(
      creatorId,
      'profile_submitted',
      'Career profile submitted',
      'Your profile has been submitted to the iRAS career team for initial review.'
    );

    return (
      updated || {
        id: creatorId,
        creator_id: creatorId,
        status: 'under_review',
        completeness_percentage: 100,
        assigned_consultant: DEFAULT_CONSULTANT,
        submitted_at: now,
        created_at: now,
        updated_at: now,
      }
    );
  }

  /**
   * Fetches the creator's COR Request status and Member status
   */
  async getRequestAndMembership(creatorId: string): Promise<{
    requestStatus: CorRequestStatus;
    memberStatus: CorMemberStatus | null;
    declinedReason: string | null;
    submittedAt: string | null;
  }> {
    let requestStatus: CorRequestStatus = 'NotSubmitted';
    let memberStatus: CorMemberStatus | null = null;
    let declinedReason: string | null = null;
    let submittedAt: string | null = null;

    // 1. First attempt to check `cor_requests`
    try {
      const { data: req, error } = await this.supabase
        .from('cor_requests')
        .select('*')
        .eq('creator_id', creatorId)
        .maybeSingle();

      if (!error && req) {
        requestStatus = (req.status as CorRequestStatus) || 'Pending';
        declinedReason = req.declined_reason || null;
        submittedAt = req.submitted_at || null;

        if (requestStatus === 'Approved') {
          // Check `cor_members`
          try {
            const { data: member } = await this.supabase
              .from('cor_members')
              .select('*')
              .eq('creator_id', creatorId)
              .maybeSingle();

            if (member) {
              memberStatus = (member.status as CorMemberStatus) || 'Active';
            } else {
              memberStatus = 'Active';
            }
          } catch {
            memberStatus = 'Active';
          }
        }

        return { requestStatus, memberStatus, declinedReason, submittedAt };
      }
    } catch {
      // Table may not exist or query error; proceed to fallback
    }

    // 2. Fallback check on `cor_profiles`
    try {
      const { data: cp } = await this.supabase
        .from('cor_profiles')
        .select('*')
        .eq('creator_id', creatorId)
        .maybeSingle();

      if (cp) {
        if (cp.status === 'active') {
          requestStatus = 'Approved';
          memberStatus = 'Active';
        } else if (cp.status === 'under_review' || cp.submitted_at) {
          requestStatus = 'Pending';
          submittedAt = cp.submitted_at;
        } else if (cp.status === 'paused') {
          requestStatus = 'Approved';
          memberStatus = 'Paused';
        } else {
          requestStatus = 'NotSubmitted';
        }
      }
    } catch {}

    return { requestStatus, memberStatus, declinedReason, submittedAt };
  }

  /**
   * Submits a formal COR Membership Request (Phase 9)
   */
  async submitCorRequest(creatorId: string): Promise<{ success: boolean; requestStatus: CorRequestStatus }> {
    const now = new Date().toISOString();

    // 1. Upsert to cor_requests if table exists
    try {
      await this.supabase.from('cor_requests').upsert(
        {
          creator_id: creatorId,
          status: 'Pending',
          submitted_at: now,
          updated_at: now,
        },
        { onConflict: 'creator_id' }
      );
    } catch (e) {
      console.warn('cor_requests upsert warning:', e);
    }

    // 2. Synchronize cor_profiles
    try {
      await this.supabase.from('cor_profiles').upsert(
        {
          creator_id: creatorId,
          status: 'under_review',
          completeness_percentage: 100,
          assigned_consultant: DEFAULT_CONSULTANT,
          submitted_at: now,
          updated_at: now,
        },
        { onConflict: 'creator_id' }
      );
    } catch (e) {
      console.warn('cor_profiles upsert warning:', e);
    }

    // 3. Log activity
    await this.logActivity(
      creatorId,
      'request_submitted',
      'COR Membership Request Submitted',
      'Your COR request and questionnaire have been submitted for curatorial review.'
    );

    return { success: true, requestStatus: 'Pending' };
  }

  /**
   * Fetches opportunities with transparent rule-based matching
   */
  async getOpportunities(
    creatorId: string,
    filters?: {
      search?: string;
      workplace?: string;
      location?: string;
    }
  ): Promise<CorOpportunity[]> {
    // 1. Fetch creator full profile for matching
    const profile = await this.getFullProfile(creatorId);

    // 2. Fetch from cor_opportunities or fallback to public jobs table
    let opps: CorOpportunity[] = [];

    try {
      const { data: corOpps } = await this.supabase
        .from('cor_opportunities')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (corOpps && corOpps.length > 0) {
        opps = corOpps;
      }
    } catch {}

    // Also include opportunities from the existing jobs table if needed
    if (opps.length === 0) {
      const { data: existingJobs } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (existingJobs) {
        opps = existingJobs.map((j) => ({
          id: j.id,
          job_id: j.id,
          role: j.title,
          company: j.company,
          location: j.location,
          workplace_type: (j.type?.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid') as any,
          salary_range: 'Curatorial grant / Commensurate with experience',
          skills: j.requirements ? [j.requirements] : ['Visual Arts', 'Studio Practice'],
          description: j.description || 'Curated exhibition and professional studio opportunity.',
          requirements: j.requirements,
          external_url: null,
          recruiter_contact: null,
          is_curated: true,
          status: 'open',
          created_at: j.created_at,
        }));
      }
    }

    // Filter by search / workplace
    if (filters?.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      opps = opps.filter(
        (o) =>
          o.role.toLowerCase().includes(q) ||
          o.company.toLowerCase().includes(q) ||
          o.location.toLowerCase().includes(q) ||
          o.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (filters?.workplace && filters.workplace !== 'All') {
      opps = opps.filter((o) => o.workplace_type.toLowerCase() === filters.workplace!.toLowerCase());
    }

    // Compute rule-based matching reasons
    return opps.map((opp) => {
      const { match_reasons, is_matched } = calculateMatchReasons(opp, profile);
      return {
        ...opp,
        match_reasons,
        is_matched,
      };
    });
  }

  /**
   * Fetches single opportunity by ID
   */
  async getOpportunityById(id: string, creatorId: string): Promise<CorOpportunity | null> {
    const all = await this.getOpportunities(creatorId);
    return all.find((o) => o.id === id) || null;
  }

  /**
   * Fetches applications with pipeline stages for candidate
   */
  async getApplications(creatorId: string): Promise<CorApplication[]> {
    try {
      const { data: apps } = await this.supabase
        .from('cor_applications')
        .select('*')
        .eq('candidate_id', creatorId)
        .order('created_at', { ascending: false });

      if (apps && apps.length > 0) {
        // Attach opportunities
        const opps = await this.getOpportunities(creatorId);
        return apps.map((a) => {
          const opp = opps.find((o) => o.id === a.opportunity_id);
          // Strip internal notes!
          const { internal_notes, ...safeApp } = a;
          return {
            ...safeApp,
            opportunity: opp,
          };
        });
      }
    } catch {}

    // Fallback: check job_applications
    const { data: jobApps } = await this.supabase
      .from('job_applications')
      .select('*, jobs(*)')
      .eq('candidate_id', creatorId);

    if (jobApps && jobApps.length > 0) {
      return jobApps.map((ja) => ({
        id: ja.id,
        candidate_id: ja.candidate_id,
        opportunity_id: ja.job_id,
        current_stage: (ja.status === 'accepted' ? 'Offer' : ja.status === 'shortlisted' ? 'Interview' : 'Applied') as CorApplicationStage,
        applied_date: ja.created_at,
        interview_date: null,
        creator_notes: ja.cover_letter || null,
        created_at: ja.created_at,
        updated_at: ja.created_at,
        opportunity: ja.jobs
          ? {
              id: ja.jobs.id,
              role: ja.jobs.title,
              company: ja.jobs.company,
              location: ja.jobs.location,
              workplace_type: 'Hybrid',
              salary_range: 'Grant allocation',
              skills: [],
              description: ja.jobs.description || '',
              is_curated: true,
              status: ja.jobs.status || 'open',
              created_at: ja.jobs.created_at,
            }
          : undefined,
      }));
    }

    return [];
  }

  /**
   * Creates a new application or pipeline tracking item
   */
  async createApplication(
    creatorId: string,
    opportunityId: string,
    initialNotes?: string
  ): Promise<{ success: boolean; application: CorApplication }> {
    const now = new Date().toISOString();

    const newAppRecord = {
      candidate_id: creatorId,
      opportunity_id: opportunityId,
      current_stage: 'Preparing Application' as CorApplicationStage,
      applied_date: now,
      interview_date: null as string | null,
      creator_notes: initialNotes || null,
      created_at: now,
      updated_at: now,
    };

    let createdId = opportunityId;
    try {
      const { data, error } = await this.supabase
        .from('cor_applications')
        .insert(newAppRecord)
        .select()
        .single();
      if (data) createdId = data.id;
    } catch {}

    // Create initial timeline event
    await this.logApplicationEvent(
      createdId,
      'Preparing Application',
      'Application prepared',
      'Opportunity added to application pipeline.'
    );

    // Also mirror to job_applications if job exists
    try {
      await this.supabase.from('job_applications').insert({
        job_id: opportunityId,
        candidate_id: creatorId,
        cover_letter: initialNotes || 'COR Application Submission',
        status: 'pending',
      });
    } catch {}

    // Log Activity
    const opp = await this.getOpportunityById(opportunityId, creatorId);
    await this.logActivity(
      creatorId,
      'application_created',
      'Application initiated',
      `Started application for ${opp?.role || 'opportunity'} at ${opp?.company || 'partner organization'}.`
    );

    return {
      success: true,
      application: {
        id: createdId,
        ...newAppRecord,
        opportunity: opp || undefined,
      },
    };
  }

  /**
   * Fetches timeline events for an application
   */
  async getApplicationEvents(applicationId: string, creatorId: string): Promise<CorApplicationEvent[]> {
    try {
      const { data: events } = await this.supabase
        .from('cor_application_events')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (events && events.length > 0) return events;
    } catch {}

    // Return default initial events for the application
    return [
      {
        id: 'evt-1',
        application_id: applicationId,
        stage: 'Opportunity Identified',
        title: 'Opportunity Identified',
        note: 'Opportunity selected for curatorial review.',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'evt-2',
        application_id: applicationId,
        stage: 'Preparing Application',
        title: 'Preparing Application',
        note: 'Portfolio and materials submitted to career advisor.',
        created_at: new Date().toISOString(),
      },
    ];
  }

  /**
   * Moves application stage and appends timeline event
   */
  async updateApplicationStage(
    creatorId: string,
    applicationId: string,
    newStage: CorApplicationStage,
    note?: string
  ): Promise<{ success: boolean }> {
    const now = new Date().toISOString();

    try {
      await this.supabase
        .from('cor_applications')
        .update({
          current_stage: newStage,
          updated_at: now,
          ...(newStage === 'Applied' ? { applied_date: now } : {}),
        })
        .eq('id', applicationId)
        .eq('candidate_id', creatorId);
    } catch {}

    await this.logApplicationEvent(
      applicationId,
      newStage,
      `Stage updated to ${newStage}`,
      note || `Application progressed to ${newStage} stage.`
    );

    await this.logActivity(
      creatorId,
      'stage_updated',
      `Application updated: ${newStage}`,
      `Your application was transitioned to ${newStage}.`
    );

    return { success: true };
  }

  /**
   * Consultations
   */
  async getConsultations(creatorId: string): Promise<CorConsultation[]> {
    try {
      const { data } = await this.supabase
        .from('cor_consultations')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (data) {
        return data.map(({ internal_notes, ...c }) => c as CorConsultation);
      }
    } catch {}

    return [];
  }

  async bookConsultation(
    creatorId: string,
    slotTime: string,
    purpose: string,
    creatorNotes?: string
  ): Promise<{ success: boolean; consultation: CorConsultation }> {
    const now = new Date().toISOString();
    const newConsultation: CorConsultation = {
      id: `call-${Date.now()}`,
      creator_id: creatorId,
      consultant_name: DEFAULT_CONSULTANT,
      slot_time: slotTime,
      duration_minutes: 30,
      purpose,
      status: 'scheduled',
      creator_notes: creatorNotes || null,
      created_at: now,
      updated_at: now,
    };

    try {
      const { data } = await this.supabase
        .from('cor_consultations')
        .insert({
          creator_id: creatorId,
          consultant_name: DEFAULT_CONSULTANT,
          slot_time: slotTime,
          duration_minutes: 30,
          purpose,
          status: 'scheduled',
          creator_notes: creatorNotes || null,
        })
        .select()
        .single();
      if (data) newConsultation.id = data.id;
    } catch {}

    await this.logActivity(
      creatorId,
      'consultation_booked',
      'Consultation Scheduled',
      `Booked 30-minute career consultation with ${DEFAULT_CONSULTANT} for ${slotTime}.`
    );

    return { success: true, consultation: newConsultation };
  }

  async cancelConsultation(creatorId: string, consultationId: string): Promise<{ success: boolean }> {
    try {
      await this.supabase
        .from('cor_consultations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', consultationId)
        .eq('creator_id', creatorId);
    } catch {}

    await this.logActivity(
      creatorId,
      'consultation_cancelled',
      'Consultation Cancelled',
      'Scheduled consultation booking was cancelled.'
    );

    return { success: true };
  }

  /**
   * Recent Activity Log
   */
  async getRecentActivity(creatorId: string): Promise<CorActivity[]> {
    try {
      const { data } = await this.supabase
        .from('cor_activities')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) return data;
    } catch {}

    return [];
  }

  private async logActivity(creatorId: string, type: string, title: string, description?: string) {
    try {
      await this.supabase.from('cor_activities').insert({
        creator_id: creatorId,
        activity_type: type,
        title,
        description: description || null,
      });
    } catch {}
  }

  private async logApplicationEvent(applicationId: string, stage: string, title: string, note?: string) {
    try {
      await this.supabase.from('cor_application_events').insert({
        application_id: applicationId,
        stage,
        title,
        note: note || null,
      });
    } catch {}
  }

  /**
   * Full Aggregation for Main COR Dashboard
   */
  async getDashboardData(creatorId: string): Promise<CorDashboardData> {
    const fullProfile = await this.getFullProfile(creatorId);
    const applications = await this.getApplications(creatorId);
    const consultations = await this.getConsultations(creatorId);
    const opportunities = await this.getOpportunities(creatorId);
    const recentActivities = await this.getRecentActivity(creatorId);

    // Compute pipeline counts
    const pipelineCounts: Record<CorApplicationStage, number> = {
      Recommended: 0,
      'Preparing Application': 0,
      Applied: 0,
      Screening: 0,
      Interview: 0,
      'Final Round': 0,
      Offer: 0,
      Rejected: 0,
    };

    applications.forEach((app) => {
      if (pipelineCounts[app.current_stage] !== undefined) {
        pipelineCounts[app.current_stage]++;
      }
    });

    const metrics = {
      opportunitiesFound: opportunities.length,
      applicationsSubmitted: applications.filter(
        (a) => !['Recommended', 'Preparing Application'].includes(a.current_stage)
      ).length,
      interviews: applications.filter((a) => ['Interview', 'Final Round'].includes(a.current_stage)).length,
      offers: applications.filter((a) => a.current_stage === 'Offer').length,
    };

    const upcomingConsultation =
      consultations.find((c) => c.status === 'scheduled') || null;

    const { requestStatus, memberStatus, declinedReason, submittedAt } =
      await this.getRequestAndMembership(creatorId);

    return {
      requestStatus,
      memberStatus,
      declinedReason,
      submittedAt,
      profile: fullProfile.profile,
      fullProfile,
      pipelineCounts,
      metrics,
      upcomingConsultation,
      recentOpportunities: opportunities.slice(0, 3),
      recentActivities,
      recentApplications: applications.slice(0, 5),
    };
  }
}

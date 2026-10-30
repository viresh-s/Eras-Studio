import {
  CareerOpportunity,
  CareerOpportunityFilters,
  CareerOpportunityStatus,
  CareerApplication,
  CareerApplicationFilters,
  CareerApplicationStatus,
} from "../types";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/server";

// In-memory fallback stores
let opportunitiesStore: CareerOpportunity[] = [
  {
    id: "co_01",
    title: "Senior Editorial Curator",
    department: "Curation & Exhibitions",
    employmentType: "Full-time",
    location: "New York, NY",
    workMode: "Hybrid",
    description:
      "We are seeking an experienced Editorial Curator to lead contemporary creator acquisitions, digital gallery curation, and partner institution programming for Eras Studio worldwide.",
    responsibilities:
      "• Curate weekly featured exhibitions and editorial collections for the Eras marketplace.\n• Lead evaluation of artist applications and collaborate with COR representatives.\n• Author curatorial essays, exhibition narratives, and catalog forewords.\n• Build partnerships with international contemporary galleries and cultural foundations.",
    requirements:
      "• 5+ years of curatorial experience in contemporary art, digital platforms, or gallery spaces.\n• Proven network of international visual artists, digital creators, and cultural critics.\n• Flawless editorial writing and deep critical art discourse understanding.\n• Master's degree in Art History, Curatorial Studies, or equivalent experience.",
    experience: "5+ years",
    applicationDeadline: "2026-12-31T23:59:59.000Z",
    openings: 2,
    status: "published",
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
    applicationCount: 2,
  },
  {
    id: "co_02",
    title: "Lead Platform Engineer",
    department: "Engineering",
    employmentType: "Full-time",
    location: "San Francisco, CA / London, UK",
    workMode: "Remote",
    description:
      "Join our core engineering team building the next-generation infrastructure for art provenance, high-resolution media protection, real-time collector communications, and curatorial workflows.",
    responsibilities:
      "• Architect resilient, high-performance web applications using Next.js, React 19, and Supabase.\n• Design secure asset delivery pipelines with zero-copy watermarking and asset protection.\n• Optimize database query performance, indexing, and real-time subscription pipelines.\n• Mentor engineering peers and uphold uncompromising standards of code quality and security.",
    requirements:
      "• 6+ years building scalable modern web applications with TypeScript, Node.js, and Postgres.\n• Deep expertise in Next.js App Router, React Server Components, and SSR architectures.\n• Experience with media streaming, CDN distribution, and anti-scraping protections.\n• Strong security mindset regarding OWASP top 10, RBAC, and data privacy.",
    experience: "6+ years",
    applicationDeadline: "2026-11-30T23:59:59.000Z",
    openings: 1,
    status: "published",
    createdAt: "2026-10-05T14:30:00.000Z",
    updatedAt: "2026-10-05T14:30:00.000Z",
    applicationCount: 1,
  },
  {
    id: "co_03",
    title: "Artist Relations Manager",
    department: "Creator Partnerships",
    employmentType: "Full-time",
    location: "Paris, France / Remote",
    workMode: "Hybrid",
    description:
      "Act as the primary champion for independent artists and studios on Eras Studio. Guide creators through onboarding, studio setup, exhibition participation, and career representation.",
    responsibilities:
      "• Build empathetic, consultative relationships with invited creators across 20+ countries.\n• Conduct portfolio reviews and guide artists on optimizing digital presentations.\n• Facilitate collector introductions, inquiry negotiations, and private commissions.\n• Gather creator product feedback to directly influence Eras Studio roadmap features.",
    requirements:
      "• 3+ years in artist management, gallery relations, or creative agency accounts.\n• Fluent verbal and written communication in English; French or German is a plus.\n• High emotional intelligence, discretion, and passion for visual arts culture.\n• Familiarity with modern artist tools, contract structures, and copyright fundamentals.",
    experience: "3+ years",
    applicationDeadline: "2026-12-15T23:59:59.000Z",
    openings: 2,
    status: "published",
    createdAt: "2026-10-10T09:15:00.000Z",
    updatedAt: "2026-10-10T09:15:00.000Z",
    applicationCount: 0,
  },
  {
    id: "co_04",
    title: "Brand Design & Visual Identity Intern",
    department: "Brand & Marketing",
    employmentType: "Internship",
    location: "Berlin, Germany",
    workMode: "On-site",
    description:
      "Support the Eras Studio creative studio in designing digital editorial monographs, social storytelling, physical vernissage collateral, and exhibition identity systems.",
    responsibilities:
      "• Assist in typography experimentation, layout design, and publication layout.\n• Create motion assets and editorial previews for featured creator spotlights.\n• Maintain and extend the Eras Studio design system guidelines.",
    requirements:
      "• Enrolled in or recently graduated from a Graphic Design, Visual Arts, or Typography program.\n• Outstanding portfolio demonstrating editorial sensibility, layout mastery, and typographic craft.\n• Proficiency in Figma and Adobe Creative Suite.\n• Passion for contemporary fine art, independent publishing, and architecture.",
    experience: "Student / Graduate",
    applicationDeadline: "2026-12-20T23:59:59.000Z",
    openings: 1,
    status: "draft",
    createdAt: "2026-10-18T16:00:00.000Z",
    updatedAt: "2026-10-18T16:00:00.000Z",
    applicationCount: 0,
  },
];

let applicationsStore: CareerApplication[] = [
  {
    id: "ca_01",
    opportunityId: "co_01",
    opportunityTitle: "Senior Editorial Curator",
    candidateName: "Julian Moreau",
    email: "julian.moreau@contemporarycurators.org",
    phone: "+1 (212) 555-0184",
    resumeUrl: "/uploads/resumes/julian_moreau_cv.pdf",
    portfolioUrl: "https://julianmoreau-curatorial.com",
    linkedinUrl: "https://linkedin.com/in/julian-moreau-curator",
    coverLetter:
      "Dear Eras Studio Selection Committee,\n\nI have followed Eras Studio's editorial approach to independent creators with immense admiration. Having curated exhibitions across Paris and New York over the past seven years, I recognize how rare it is to find a digital ecosystem that treats art with true institutional reverence. I would welcome the opportunity to direct your curatorial vision and expand your creator roster.",
    status: "Under Review",
    adminNotes: "Impressive background at Palais de Tokyo and Whitney Independent Study. Schedule preliminary interview.",
    appliedAt: "2026-10-12T11:20:00.000Z",
    updatedAt: "2026-10-14T09:00:00.000Z",
  },
  {
    id: "ca_02",
    opportunityId: "co_01",
    opportunityTitle: "Senior Editorial Curator",
    candidateName: "Amara Patel",
    email: "amara.patel@artsreview.co.uk",
    phone: "+44 20 7946 0912",
    resumeUrl: "/uploads/resumes/amara_patel_curatorial.pdf",
    portfolioUrl: "https://amarapatel.art",
    linkedinUrl: "https://linkedin.com/in/amara-patel-arts",
    coverLetter:
      "To the Leadership at Eras Studio,\n\nAs a curatorial fellow and art critic focusing on South Asian modernisms and diaspora creators, I believe Eras Studio represents the most exciting bridge between physical galleries and global patrons. My catalog essays and biennial experience align directly with your expansion plans.",
    status: "Shortlisted",
    adminNotes: "Outstanding writing samples. Potential lead for international biennial initiatives.",
    appliedAt: "2026-10-15T15:45:00.000Z",
    updatedAt: "2026-10-18T14:10:00.000Z",
  },
  {
    id: "ca_03",
    opportunityId: "co_02",
    opportunityTitle: "Lead Platform Engineer",
    candidateName: "Marcus Sterling",
    email: "m.sterling@devcraft.io",
    phone: "+1 (415) 555-8392",
    resumeUrl: "/uploads/resumes/marcus_sterling_resume.pdf",
    portfolioUrl: "https://github.com/msterling",
    linkedinUrl: "https://linkedin.com/in/marcussterling",
    coverLetter:
      "Hi Eras Studio Team,\n\nI am a principal full-stack engineer with 8 years of experience scaling Next.js and Postgres platforms handling high-value digital media. I previously architected the core bidding and catalog engine for a European auction house. I would love to bring that technical rigor to Eras Studio.",
    status: "Interview",
    adminNotes: "Technical screening completed with highest score. System design interview scheduled for Thursday.",
    appliedAt: "2026-10-16T18:10:00.000Z",
    updatedAt: "2026-10-20T10:30:00.000Z",
  },
];

function mapOpportunityFromSupabase(row: any, applicationCount = 0): CareerOpportunity {
  return {
    id: String(row.id),
    title: row.title || "Untitled Opportunity",
    department: row.department || "General",
    employmentType: row.employment_type || "Full-time",
    location: row.location || "Remote",
    workMode: row.work_mode || "Remote",
    description: row.description || "",
    responsibilities: row.responsibilities || "",
    requirements: row.requirements || "",
    experience: row.experience || "",
    applicationDeadline: row.application_deadline || null,
    openings: Number(row.openings) || 1,
    status: (row.status?.toLowerCase() as CareerOpportunityStatus) || "draft",
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    applicationCount,
  };
}

function mapApplicationFromSupabase(row: any, opportunityTitle?: string): CareerApplication {
  return {
    id: String(row.id),
    opportunityId: String(row.opportunity_id),
    opportunityTitle: opportunityTitle || row.career_opportunities?.title || "Career Opportunity",
    candidateName: row.candidate_name || "Unknown Candidate",
    email: row.email || "",
    phone: row.phone || "",
    resumeUrl: row.resume_url || "",
    portfolioUrl: row.portfolio_url || null,
    linkedinUrl: row.linkedin_url || null,
    coverLetter: row.cover_letter || "",
    status: (row.status as CareerApplicationStatus) || "Applied",
    adminNotes: row.admin_notes || null,
    appliedAt: row.applied_at || row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export const careersRepo = {
  // ============================================================================
  // OPPORTUNITIES
  // ============================================================================

  /**
   * List career opportunities with optional filters.
   */
  async list(filters?: CareerOpportunityFilters): Promise<CareerOpportunity[]> {
    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        let query = (supabase.from("career_opportunities") as any).select(`
          *,
          career_applications(count)
        `);

        if (filters?.status && filters.status !== "all") {
          query = query.eq("status", filters.status.toLowerCase());
        }

        if (filters?.department) {
          query = query.ilike("department", `%${filters.department}%`);
        }

        if (filters?.workMode) {
          query = query.ilike("work_mode", `%${filters.workMode}%`);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          let list = data.map((row: any) => {
            const count = row.career_applications?.[0]?.count ?? 0;
            return mapOpportunityFromSupabase(row, count);
          });

          if (filters?.query) {
            const q = filters.query.toLowerCase().trim();
            list = list.filter(
              (o: CareerOpportunity) =>
                o.title.toLowerCase().includes(q) ||
                o.department.toLowerCase().includes(q) ||
                o.location.toLowerCase().includes(q) ||
                o.description.toLowerCase().includes(q)
            );
          }

          return list;
        } else if (error) {
          console.warn("Supabase career_opportunities list query fallback:", error.message);
        }
      } catch (err) {
        console.warn("Supabase career_opportunities query error, fallback used:", err);
      }
    }

    // In-memory fallback
    let result = [...opportunitiesStore];

    if (filters?.status && filters.status !== "all") {
      result = result.filter((o) => o.status.toLowerCase() === filters.status?.toLowerCase());
    }

    if (filters?.department) {
      const dep = filters.department.toLowerCase();
      result = result.filter((o) => o.department.toLowerCase().includes(dep));
    }

    if (filters?.workMode) {
      const wm = filters.workMode.toLowerCase();
      result = result.filter((o) => o.workMode.toLowerCase().includes(wm));
    }

    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.department.toLowerCase().includes(q) ||
          o.location.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q)
      );
    }

    // Update dynamic application counts in memory
    return result.map((opp) => ({
      ...opp,
      applicationCount: applicationsStore.filter((a) => a.opportunityId === opp.id).length,
    }));
  },

  /**
   * Retrieve a single opportunity by ID.
   */
  async getById(id: string): Promise<CareerOpportunity | null> {
    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        const { data, error } = await (supabase.from("career_opportunities") as any)
          .select("*, career_applications(count)")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          const count = data.career_applications?.[0]?.count ?? 0;
          return mapOpportunityFromSupabase(data, count);
        }
      } catch (err) {
        console.warn("Supabase career_opportunities getById error:", err);
      }
    }

    const found = opportunitiesStore.find((o) => o.id === id);
    if (!found) return null;
    return {
      ...found,
      applicationCount: applicationsStore.filter((a) => a.opportunityId === found.id).length,
    };
  },

  /**
   * Create a new career opportunity.
   */
  async create(
    data: Omit<CareerOpportunity, "id" | "createdAt" | "updatedAt" | "applicationCount">
  ): Promise<CareerOpportunity> {
    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        const payload = {
          title: data.title,
          department: data.department,
          employment_type: data.employmentType,
          location: data.location,
          work_mode: data.workMode,
          description: data.description,
          responsibilities: data.responsibilities || null,
          requirements: data.requirements || null,
          experience: data.experience || null,
          application_deadline: data.applicationDeadline || null,
          openings: data.openings || 1,
          status: data.status.toLowerCase(),
        };

        const { data: created, error } = await (supabase.from("career_opportunities") as any)
          .insert(payload)
          .select("*, career_applications(count)")
          .single();

        if (!error && created) {
          return mapOpportunityFromSupabase(created, 0);
        } else if (error) {
          console.warn("Supabase career_opportunities create error:", error.message);
        }
      } catch (err) {
        console.warn("Supabase career_opportunities create exception:", err);
      }
    }

    const now = new Date().toISOString();
    const newOpportunity: CareerOpportunity = {
      ...data,
      id: `co_${Date.now()}`,
      status: data.status,
      openings: data.openings || 1,
      createdAt: now,
      updatedAt: now,
      applicationCount: 0,
    };
    opportunitiesStore.unshift(newOpportunity);
    return { ...newOpportunity };
  },

  /**
   * Update an existing career opportunity.
   */
  async update(id: string, data: Partial<CareerOpportunity>): Promise<CareerOpportunity | null> {
    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        const payload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (data.title !== undefined) payload.title = data.title;
        if (data.department !== undefined) payload.department = data.department;
        if (data.employmentType !== undefined) payload.employment_type = data.employmentType;
        if (data.location !== undefined) payload.location = data.location;
        if (data.workMode !== undefined) payload.work_mode = data.workMode;
        if (data.description !== undefined) payload.description = data.description;
        if (data.responsibilities !== undefined) payload.responsibilities = data.responsibilities;
        if (data.requirements !== undefined) payload.requirements = data.requirements;
        if (data.experience !== undefined) payload.experience = data.experience;
        if (data.applicationDeadline !== undefined) payload.application_deadline = data.applicationDeadline;
        if (data.openings !== undefined) payload.openings = data.openings;
        if (data.status !== undefined) payload.status = data.status.toLowerCase();

        const { data: updated, error } = await (supabase.from("career_opportunities") as any)
          .update(payload)
          .eq("id", id)
          .select("*, career_applications(count)")
          .single();

        if (!error && updated) {
          const count = updated.career_applications?.[0]?.count ?? 0;
          return mapOpportunityFromSupabase(updated, count);
        }
      } catch (err) {
        console.warn("Supabase career_opportunities update error:", err);
      }
    }

    const index = opportunitiesStore.findIndex((o) => o.id === id);
    if (index === -1) return null;

    opportunitiesStore[index] = {
      ...opportunitiesStore[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };

    return {
      ...opportunitiesStore[index],
      applicationCount: applicationsStore.filter((a) => a.opportunityId === id).length,
    };
  },

  /**
   * Delete a career opportunity and its associated applications.
   */
  async delete(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        const { error } = await (supabase.from("career_opportunities") as any)
          .delete()
          .eq("id", id);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase career_opportunities delete error:", err);
      }
    }

    const initialLen = opportunitiesStore.length;
    opportunitiesStore = opportunitiesStore.filter((o) => o.id !== id);
    applicationsStore = applicationsStore.filter((a) => a.opportunityId !== id);
    return opportunitiesStore.length < initialLen;
  },

  /**
   * Aggregate statistics for careers dashboard.
   */
  async stats(): Promise<{
    total: number;
    published: number;
    draft: number;
    closed: number;
    totalApplications: number;
  }> {
    const [opportunities, applications] = await Promise.all([
      this.list(),
      this.listApplications(),
    ]);

    const total = opportunities.length;
    const published = opportunities.filter((o) => o.status === "published").length;
    const draft = opportunities.filter((o) => o.status === "draft").length;
    const closed = opportunities.filter((o) => o.status === "closed").length;
    const totalApplications = applications.length;

    return {
      total,
      published,
      draft,
      closed,
      totalApplications,
    };
  },

  // ============================================================================
  // APPLICATIONS
  // ============================================================================

  /**
   * List applications with optional filtering.
   */
  async listApplications(filters?: CareerApplicationFilters): Promise<CareerApplication[]> {
    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        let query = (supabase.from("career_applications") as any).select(`
          *,
          career_opportunities(title)
        `);

        if (filters?.opportunityId && filters.opportunityId !== "all") {
          query = query.eq("opportunity_id", filters.opportunityId);
        }

        if (filters?.status && filters.status !== "all") {
          query = query.eq("status", filters.status);
        }

        const { data, error } = await query.order("applied_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          let list = data.map((row: any) =>
            mapApplicationFromSupabase(row, row.career_opportunities?.title)
          );

          if (filters?.query) {
            const q = filters.query.toLowerCase().trim();
            list = list.filter(
              (a: CareerApplication) =>
                a.candidateName.toLowerCase().includes(q) ||
                a.email.toLowerCase().includes(q) ||
                a.phone.toLowerCase().includes(q) ||
                (a.opportunityTitle && a.opportunityTitle.toLowerCase().includes(q))
            );
          }

          return list;
        } else if (error) {
          console.warn("Supabase career_applications list query fallback:", error.message);
        }
      } catch (err) {
        console.warn("Supabase career_applications query error, fallback used:", err);
      }
    }

    let result = [...applicationsStore];

    if (filters?.opportunityId && filters.opportunityId !== "all") {
      result = result.filter((a) => a.opportunityId === filters.opportunityId);
    }

    if (filters?.status && filters.status !== "all") {
      result = result.filter((a) => a.status === filters.status);
    }

    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.candidateName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.phone.toLowerCase().includes(q) ||
          (a.opportunityTitle && a.opportunityTitle.toLowerCase().includes(q))
      );
    }

    return result;
  },

  /**
   * Retrieve a single application by ID.
   */
  async getApplicationById(id: string): Promise<CareerApplication | null> {
    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        const { data, error } = await (supabase.from("career_applications") as any)
          .select("*, career_opportunities(title)")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return mapApplicationFromSupabase(data, data.career_opportunities?.title);
        }
      } catch (err) {
        console.warn("Supabase career_applications getApplicationById error:", err);
      }
    }

    const found = applicationsStore.find((a) => a.id === id);
    return found ? { ...found } : null;
  },

  /**
   * Submit/create a candidate application.
   */
  async createApplication(
    data: Omit<CareerApplication, "id" | "appliedAt" | "updatedAt" | "opportunityTitle">
  ): Promise<CareerApplication> {
    const opp = await this.getById(data.opportunityId);
    const oppTitle = opp?.title || "Career Opportunity";

    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        const payload = {
          opportunity_id: data.opportunityId,
          candidate_name: data.candidateName,
          email: data.email,
          phone: data.phone,
          resume_url: data.resumeUrl,
          portfolio_url: data.portfolioUrl || null,
          linkedin_url: data.linkedinUrl || null,
          cover_letter: data.coverLetter,
          status: "Applied",
          admin_notes: null,
        };

        const { data: created, error } = await (supabase.from("career_applications") as any)
          .insert(payload)
          .select("*, career_opportunities(title)")
          .single();

        if (!error && created) {
          return mapApplicationFromSupabase(created, oppTitle);
        } else if (error) {
          console.warn("Supabase career_applications create error:", error.message);
        }
      } catch (err) {
        console.warn("Supabase career_applications create exception:", err);
      }
    }

    const now = new Date().toISOString();
    const newApp: CareerApplication = {
      ...data,
      id: `ca_${Date.now()}`,
      opportunityTitle: oppTitle,
      status: "Applied",
      adminNotes: null,
      appliedAt: now,
      updatedAt: now,
    };

    applicationsStore.unshift(newApp);
    return { ...newApp };
  },

  /**
   * Update application status or internal admin notes.
   */
  async updateApplication(
    id: string,
    data: { status?: CareerApplicationStatus; adminNotes?: string | null }
  ): Promise<CareerApplication | null> {
    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        const payload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (data.status !== undefined) payload.status = data.status;
        if (data.adminNotes !== undefined) payload.admin_notes = data.adminNotes;

        const { data: updated, error } = await (supabase.from("career_applications") as any)
          .update(payload)
          .eq("id", id)
          .select("*, career_opportunities(title)")
          .single();

        if (!error && updated) {
          return mapApplicationFromSupabase(updated, updated.career_opportunities?.title);
        }
      } catch (err) {
        console.warn("Supabase career_applications update error:", err);
      }
    }

    const index = applicationsStore.findIndex((a) => a.id === id);
    if (index === -1) return null;

    applicationsStore[index] = {
      ...applicationsStore[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };

    return { ...applicationsStore[index] };
  },

  /**
   * Delete an application by ID.
   */
  async deleteApplication(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        const { error } = await (supabase.from("career_applications") as any)
          .delete()
          .eq("id", id);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase career_applications delete error:", err);
      }
    }

    const initialLen = applicationsStore.length;
    applicationsStore = applicationsStore.filter((a) => a.id !== id);
    return applicationsStore.length < initialLen;
  },
};


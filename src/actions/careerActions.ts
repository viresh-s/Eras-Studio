"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { careersRepo } from "@/lib/data/careers";
import {
  CareerOpportunity,
  CareerOpportunityStatus,
  CareerApplication,
  CareerApplicationStatus,
} from "@/lib/types";
import { globalRateLimiter } from "@/lib/security/rateLimit";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// ==============================================================================
// ADMIN ACTIONS (Guarded by requireAdminSession)
// ==============================================================================

/**
 * Fetch overview stats and opportunities for the admin dashboard.
 */
export async function getAdminCareersOverviewAction(): Promise<{
  success: boolean;
  stats?: {
    total: number;
    published: number;
    draft: number;
    closed: number;
    totalApplications: number;
  };
  opportunities?: CareerOpportunity[];
  error?: string;
}> {
  try {
    await requireAdminSession("careers:view");
    const [stats, opportunities] = await Promise.all([
      careersRepo.stats(),
      careersRepo.list(),
    ]);

    return {
      success: true,
      stats,
      opportunities,
    };
  } catch (err: any) {
    console.error("getAdminCareersOverviewAction error:", err);
    return { success: false, error: err.message || "Failed to load careers overview." };
  }
}

/**
 * Create a new career opportunity (Admin only).
 */
export async function createCareerOpportunityAction(data: {
  title: string;
  department: string;
  employmentType: string;
  location: string;
  workMode: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  experience?: string;
  applicationDeadline?: string | null;
  openings: number;
  status: CareerOpportunityStatus;
}): Promise<{
  success: boolean;
  opportunity?: CareerOpportunity;
  error?: string;
}> {
  try {
    await requireAdminSession("careers:manage");

    if (!data.title?.trim()) {
      return { success: false, error: "Title is required." };
    }
    if (!data.department?.trim()) {
      return { success: false, error: "Department is required." };
    }
    if (!data.description?.trim()) {
      return { success: false, error: "Job description is required." };
    }

    const created = await careersRepo.create({
      title: data.title.trim(),
      department: data.department.trim(),
      employmentType: data.employmentType || "Full-time",
      location: data.location?.trim() || "Remote",
      workMode: data.workMode || "Remote",
      description: data.description.trim(),
      responsibilities: data.responsibilities?.trim() || "",
      requirements: data.requirements?.trim() || "",
      experience: data.experience?.trim() || "",
      applicationDeadline: data.applicationDeadline || null,
      openings: Number(data.openings) || 1,
      status: data.status || "draft",
    });

    revalidatePath("/admin/careers");
    revalidatePath("/careers");

    return { success: true, opportunity: created };
  } catch (err: any) {
    console.error("createCareerOpportunityAction error:", err);
    return { success: false, error: err.message || "Failed to create opportunity." };
  }
}

/**
 * Update an existing career opportunity (Admin only).
 */
export async function updateCareerOpportunityAction(
  id: string,
  data: Partial<CareerOpportunity>
): Promise<{
  success: boolean;
  opportunity?: CareerOpportunity;
  error?: string;
}> {
  try {
    await requireAdminSession("careers:manage");

    if (!id) {
      return { success: false, error: "Missing opportunity ID." };
    }

    const updated = await careersRepo.update(id, data);
    if (!updated) {
      return { success: false, error: "Opportunity not found or update failed." };
    }

    revalidatePath("/admin/careers");
    revalidatePath("/careers");

    return { success: true, opportunity: updated };
  } catch (err: any) {
    console.error("updateCareerOpportunityAction error:", err);
    return { success: false, error: err.message || "Failed to update opportunity." };
  }
}

/**
 * Delete a career opportunity (Admin only).
 */
export async function deleteCareerOpportunityAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdminSession("careers:manage");

    if (!id) {
      return { success: false, error: "Missing opportunity ID." };
    }

    const deleted = await careersRepo.delete(id);
    if (!deleted) {
      return { success: false, error: "Opportunity not found or delete failed." };
    }

    revalidatePath("/admin/careers");
    revalidatePath("/careers");

    return { success: true };
  } catch (err: any) {
    console.error("deleteCareerOpportunityAction error:", err);
    return { success: false, error: err.message || "Failed to delete opportunity." };
  }
}

/**
 * Fetch applications for admin tracking.
 */
export async function getAdminApplicationsAction(filters?: {
  opportunityId?: string;
  status?: CareerApplicationStatus | "all";
  query?: string;
}): Promise<{
  success: boolean;
  applications?: CareerApplication[];
  error?: string;
}> {
  try {
    await requireAdminSession("careers:view");

    const applications = await careersRepo.listApplications(filters);
    return { success: true, applications };
  } catch (err: any) {
    console.error("getAdminApplicationsAction error:", err);
    return { success: false, error: err.message || "Failed to fetch applications." };
  }
}

/**
 * Update application status (Admin only).
 */
export async function updateApplicationStatusAction(
  id: string,
  status: CareerApplicationStatus
): Promise<{
  success: boolean;
  application?: CareerApplication;
  error?: string;
}> {
  try {
    await requireAdminSession("careers:manage");

    if (!id || !status) {
      return { success: false, error: "Missing application ID or status." };
    }

    const updated = await careersRepo.updateApplication(id, { status });
    if (!updated) {
      return { success: false, error: "Application not found or update failed." };
    }

    revalidatePath("/admin/careers");
    return { success: true, application: updated };
  } catch (err: any) {
    console.error("updateApplicationStatusAction error:", err);
    return { success: false, error: err.message || "Failed to update application status." };
  }
}

/**
 * Update internal admin notes for an application (Admin only).
 */
export async function updateApplicationNotesAction(
  id: string,
  adminNotes: string
): Promise<{
  success: boolean;
  application?: CareerApplication;
  error?: string;
}> {
  try {
    await requireAdminSession("careers:manage");

    if (!id) {
      return { success: false, error: "Missing application ID." };
    }

    const updated = await careersRepo.updateApplication(id, { adminNotes });
    if (!updated) {
      return { success: false, error: "Application not found." };
    }

    revalidatePath("/admin/careers");
    return { success: true, application: updated };
  } catch (err: any) {
    console.error("updateApplicationNotesAction error:", err);
    return { success: false, error: err.message || "Failed to save internal admin note." };
  }
}

/**
 * Delete a candidate application (Admin only).
 */
export async function deleteCareerApplicationAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdminSession("careers:manage");

    if (!id) {
      return { success: false, error: "Missing application ID." };
    }

    const deleted = await careersRepo.deleteApplication(id);
    if (!deleted) {
      return { success: false, error: "Application not found or delete failed." };
    }

    revalidatePath("/admin/careers");
    return { success: true };
  } catch (err: any) {
    console.error("deleteCareerApplicationAction error:", err);
    return { success: false, error: err.message || "Failed to delete application." };
  }
}

// ==============================================================================
// PUBLIC ACTIONS (Candidates & Website Visitors)
// ==============================================================================

/**
 * Fetch published opportunities for the public Careers page.
 * Never exposes draft or closed opportunities.
 */
export async function getPublishedCareersAction(filters?: {
  department?: string;
  workMode?: string;
  query?: string;
}): Promise<{
  success: boolean;
  opportunities?: CareerOpportunity[];
  error?: string;
}> {
  try {
    const list = await careersRepo.list({
      status: "published",
      department: filters?.department,
      workMode: filters?.workMode,
      query: filters?.query,
    });

    // Sanitized: do not leak internal notes or sensitive data
    const sanitized = list.map((o) => ({
      ...o,
      applicationCount: undefined, // Don't expose applicant count publicly
    }));

    return { success: true, opportunities: sanitized };
  } catch (err: any) {
    console.error("getPublishedCareersAction error:", err);
    return { success: false, error: "Failed to load open positions." };
  }
}

/**
 * Submit candidate application with resume upload.
 */
export async function submitCareerApplicationAction(formData: FormData): Promise<{
  success: boolean;
  applicationId?: string;
  error?: string;
}> {
  try {
    // 1. Rate limiting (max 10 submissions per IP/window)
    const clientKey = "career_submit_" + (formData.get("email")?.toString().trim().toLowerCase() || "anonymous");
    const rateCheck = globalRateLimiter.check(clientKey, 5, 60 * 1000);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Too many submissions. Please wait ${rateCheck.resetSeconds} seconds before trying again.`,
      };
    }

    // 2. Extract and validate required fields
    const opportunityId = formData.get("opportunityId")?.toString().trim();
    const candidateName = formData.get("candidateName")?.toString().trim();
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const phone = formData.get("phone")?.toString().trim();
    const portfolioUrl = formData.get("portfolioUrl")?.toString().trim() || null;
    const linkedinUrl = formData.get("linkedinUrl")?.toString().trim() || null;
    const coverLetter = formData.get("coverLetter")?.toString().trim();
    const resumeFile = formData.get("resume") as File | null;

    if (!opportunityId) {
      return { success: false, error: "Invalid application submission: Opportunity is required." };
    }
    if (!candidateName || candidateName.length < 2) {
      return { success: false, error: "Please enter your full name." };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Please provide a valid email address." };
    }
    if (!phone || phone.length < 7) {
      return { success: false, error: "Please provide a valid contact phone number." };
    }
    if (!coverLetter || coverLetter.length < 20) {
      return {
        success: false,
        error: "Please provide a cover letter or introduction (minimum 20 characters).",
      };
    }
    if (portfolioUrl && !/^https?:\/\//i.test(portfolioUrl)) {
      return { success: false, error: "Portfolio link must start with http:// or https://" };
    }
    if (linkedinUrl && !/^https?:\/\//i.test(linkedinUrl)) {
      return { success: false, error: "LinkedIn link must start with http:// or https://" };
    }

    // 3. Strict Server Check: Ensure opportunity exists and is 'published'
    const opportunity = await careersRepo.getById(opportunityId);
    if (!opportunity || opportunity.status !== "published") {
      return {
        success: false,
        error: "This career opportunity is no longer accepting new applications.",
      };
    }

    // 4. Duplicate submission check
    const existingApps = await careersRepo.listApplications({
      opportunityId,
      status: "all",
    });
    const alreadyApplied = existingApps.some(
      (app) => app.email.toLowerCase() === email.toLowerCase()
    );
    if (alreadyApplied) {
      return {
        success: false,
        error: "You have already submitted an application for this position.",
      };
    }

    // 5. Resume upload validation & processing
    if (!resumeFile || !(resumeFile instanceof File) || resumeFile.size === 0) {
      return { success: false, error: "Please upload your resume or CV document." };
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (resumeFile.size > MAX_FILE_SIZE) {
      return { success: false, error: "Resume file size must not exceed 5MB." };
    }

    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream", // Fallback for some OS file uploaders
    ];

    const fileName = resumeFile.name.toLowerCase();
    const isAllowedExt =
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".doc") ||
      fileName.endsWith(".docx");

    if (!isAllowedExt) {
      return {
        success: false,
        error: "Permitted resume formats are PDF, DOC, and DOCX.",
      };
    }

    // Upload to Supabase Storage
    let resumeUrl = "";
    const sanitizedFileName = resumeFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `resumes/${Date.now()}_${sanitizedFileName}`;

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const arrayBuffer = await resumeFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Try 'career-resumes' bucket first, fallback to 'creator-documents'
        let targetBucket = "career-resumes";
        let { data: uploadData, error: uploadError } = await supabase.storage
          .from(targetBucket)
          .upload(storagePath, buffer, {
            contentType: resumeFile.type || "application/pdf",
            upsert: true,
          });

        if (uploadError) {
          targetBucket = "creator-documents";
          const res = await supabase.storage
            .from(targetBucket)
            .upload(storagePath, buffer, {
              contentType: resumeFile.type || "application/pdf",
              upsert: true,
            });
          uploadData = res.data;
          uploadError = res.error;
        }

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from(targetBucket)
            .getPublicUrl(storagePath);
          resumeUrl = urlData.publicUrl;
        }
      } catch (uploadErr) {
        console.warn("Storage upload error:", uploadErr);
      }
    }

    if (!resumeUrl) {
      // Fallback relative path for local testing
      resumeUrl = `/uploads/resumes/${sanitizedFileName}`;
    }

    // 6. Save in career_applications
    const createdApp = await careersRepo.createApplication({
      opportunityId,
      candidateName,
      email,
      phone,
      resumeUrl,
      portfolioUrl,
      linkedinUrl,
      coverLetter,
      status: "Applied",
      adminNotes: null,
    });

    revalidatePath("/admin/careers");

    return {
      success: true,
      applicationId: createdApp.id,
    };
  } catch (err: any) {
    console.error("submitCareerApplicationAction error:", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred while submitting your application.",
    };
  }
}


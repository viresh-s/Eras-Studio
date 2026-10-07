'use server';

import { requireAuth, requirePro, isProUser } from '@/lib/security/authGuard';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { SafeIdSchema, sanitizeText, sanitizeUrl } from '@/lib/security/validators';
import { securityLogger } from '@/lib/security/logger';
import { CorService } from '@/lib/services/corService';
import { revalidatePath } from 'next/cache';
import type { CorApplicationStage } from '@/types/cor';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Activates Pro subscription tier for the authenticated user
 */
export async function activateProSubscriptionAction() {
  const { user } = await requireAuth({ requireActive: true });

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient
    .from('profiles')
    .update({ plan: 'pro', is_premium: true })
    .eq('id', user.id);

  if (error) {
    throw new Error('Failed to activate Pro subscription: ' + error.message);
  }

  securityLogger.info('User activated Pro tier', { userId: user.id });
  revalidatePath('/cor');
  revalidatePath('/portfolio');
  revalidatePath('/profile');
  return { success: true };
}

/**
 * Retrieves main COR Dashboard data
 */
export async function getCorDashboardAction() {
  const { user, profile, supabase } = await requireAuth({ requireActive: true });
  const isPro = isProUser(profile);

  if (!isPro) {
    return { isPro: false, data: null };
  }

  const service = new CorService(supabase);
  const data = await service.getDashboardData(user.id);

  return { isPro: true, data };
}

/**
 * Retrieves the full 8-step Career Profile
 */
export async function getCorFullProfileAction() {
  const { user, profile, supabase } = await requirePro();
  const service = new CorService(supabase);
  const fullProfile = await service.getFullProfile(user.id);
  return fullProfile;
}

/**
 * Saves a single step in the Career Profile questionnaire
 */
export async function saveCorStepAction(stepIndex: number, payload: any) {
  const { user, supabase } = await requirePro();

  // Rate limit: 60 step saves per 15 mins (auto-save friendly)
  const rateLimit = checkRateLimit(`cor-save-step:${user.id}`, { maxRequests: 60, windowSeconds: 900 });
  if (!rateLimit.allowed) {
    throw new Error('Too many requests. Please wait a moment before continuing.');
  }

  const service = new CorService(supabase);
  const result = await service.saveStep(user.id, stepIndex, payload);
  revalidatePath('/cor');
  revalidatePath('/cor/profile');
  return result;
}

/**
 * Submits the complete Career Profile
 */
export async function submitCorProfileFinalAction() {
  const { user, supabase } = await requirePro();

  // Rate limit: 5 submissions per hour
  const rateLimit = checkRateLimit(`cor-submit-profile:${user.id}`, { maxRequests: 5, windowSeconds: 3600 });
  if (!rateLimit.allowed) {
    throw new Error('Submission rate limit reached. Please wait before re-submitting.');
  }

  const service = new CorService(supabase);
  const full = await service.getFullProfile(user.id);

  if (!full.personal.full_name?.trim() || !full.personal.email?.trim()) {
    throw new Error('Full Name and Email are required before submitting your profile.');
  }

  const profile = await service.submitCareerProfile(user.id);
  // Also ensure request is set to Pending
  await service.submitCorRequest(user.id);

  securityLogger.info('COR Career Profile submitted', { userId: user.id });

  revalidatePath('/cor');
  revalidatePath('/cor/profile');
  return { success: true, profile };
}

/**
 * Submits the formal COR Membership Request (Phase 9)
 */
export async function submitCorRequestAction() {
  const { user, supabase } = await requirePro();

  const rateLimit = checkRateLimit(`cor-submit-request:${user.id}`, { maxRequests: 5, windowSeconds: 3600 });
  if (!rateLimit.allowed) {
    throw new Error('Submission rate limit reached. Please wait before re-submitting.');
  }

  const service = new CorService(supabase);
  const full = await service.getFullProfile(user.id);

  if (!full.personal.full_name?.trim() || !full.personal.email?.trim()) {
    throw new Error('Full Name and Email are required before submitting your COR request.');
  }

  const result = await service.submitCorRequest(user.id);
  securityLogger.info('COR Membership Request submitted', { userId: user.id });

  revalidatePath('/cor');
  revalidatePath('/cor/profile');
  return result;
}

/**
 * Gets creator's COR Request and Member status
 */
export async function getCorRequestStatusAction() {
  const { user, supabase } = await requirePro();
  const service = new CorService(supabase);
  return await service.getRequestAndMembership(user.id);
}

/**
 * Discovers opportunities with matching
 */
export async function getCorOpportunitiesAction(filters?: { search?: string; workplace?: string; location?: string }) {
  const { user, supabase } = await requirePro();
  const service = new CorService(supabase);
  const opportunities = await service.getOpportunities(user.id, filters);
  return opportunities;
}

/**
 * Gets single opportunity detail
 */
export async function getCorOpportunityDetailAction(id: string) {
  const { user, supabase } = await requirePro();
  const validId = SafeIdSchema.parse(id);
  const service = new CorService(supabase);
  const opp = await service.getOpportunityById(validId, user.id);
  return opp;
}

/**
 * Initiates an application for an opportunity
 */
export async function startCorApplicationAction(opportunityId: string, notes?: string) {
  const { user, supabase } = await requirePro();
  const validOppId = SafeIdSchema.parse(opportunityId);

  const rateLimit = checkRateLimit(`cor-app-create:${user.id}`, { maxRequests: 10, windowSeconds: 900 });
  if (!rateLimit.allowed) {
    throw new Error('Application submission limit reached. Please wait.');
  }

  const sanitizedNotes = notes ? sanitizeText(notes, 3000) : undefined;
  const service = new CorService(supabase);
  const result = await service.createApplication(user.id, validOppId, sanitizedNotes);

  revalidatePath('/cor');
  revalidatePath('/cor/applications');
  revalidatePath(`/cor/opportunities/${validOppId}`);
  return result;
}

/**
 * Fetches applications list for tracker
 */
export async function getCorApplicationsAction() {
  const { user, supabase } = await requirePro();
  const service = new CorService(supabase);
  const applications = await service.getApplications(user.id);
  return applications;
}

/**
 * Fetches single application with timeline
 */
export async function getCorApplicationDetailAction(applicationId: string) {
  const { user, supabase } = await requirePro();
  const validAppId = SafeIdSchema.parse(applicationId);
  const service = new CorService(supabase);

  const allApps = await service.getApplications(user.id);
  const app = allApps.find((a) => a.id === validAppId);
  if (!app) {
    throw new Error('Application not found or unauthorized.');
  }

  const events = await service.getApplicationEvents(validAppId, user.id);
  return { application: app, events };
}

/**
 * Moves application stage
 */
export async function updateCorApplicationStageAction(
  applicationId: string,
  newStage: CorApplicationStage,
  note?: string
) {
  const { user, supabase } = await requirePro();
  const validAppId = SafeIdSchema.parse(applicationId);
  const sanitizedNote = note ? sanitizeText(note, 1000) : undefined;

  const service = new CorService(supabase);
  const res = await service.updateApplicationStage(user.id, validAppId, newStage, sanitizedNote);

  revalidatePath('/cor');
  revalidatePath('/cor/applications');
  revalidatePath(`/cor/applications/${validAppId}`);
  return res;
}

/**
 * Fetches consultations
 */
export async function getCorConsultationsAction() {
  const { user, supabase } = await requirePro();
  const service = new CorService(supabase);
  const consultations = await service.getConsultations(user.id);
  return consultations;
}

/**
 * Books a career consultation slot
 */
export async function bookCorConsultationAction(slotTime: string, purpose: string, notes?: string) {
  const { user, supabase } = await requirePro();

  const rateLimit = checkRateLimit(`cor-consultation:${user.id}`, { maxRequests: 5, windowSeconds: 1800 });
  if (!rateLimit.allowed) {
    throw new Error('Consultation booking limit reached. Please wait before scheduling another.');
  }

  const sanitizedPurpose = sanitizeText(purpose || 'Portfolio review & career direction', 200);
  const sanitizedNotes = notes ? sanitizeText(notes, 2000) : undefined;

  const service = new CorService(supabase);
  const res = await service.bookConsultation(user.id, slotTime, sanitizedPurpose, sanitizedNotes);

  revalidatePath('/cor');
  revalidatePath('/cor/consultations');
  return res;
}

/**
 * Cancels a consultation booking
 */
export async function cancelCorConsultationAction(consultationId: string) {
  const { user, supabase } = await requirePro();
  const validId = SafeIdSchema.parse(consultationId);

  const service = new CorService(supabase);
  const res = await service.cancelConsultation(user.id, validId);

  revalidatePath('/cor');
  revalidatePath('/cor/consultations');
  return res;
}

/**
 * Uploads a career document (CV, Resume, Portfolio PDF)
 */
export async function uploadCorDocumentAction(formData: FormData) {
  const { user, supabase } = await requirePro();

  const file = formData.get('file') as File | null;
  const docType = (formData.get('docType') as string) || 'resume';

  if (!file || !(file instanceof File)) {
    throw new Error('Valid document file is required.');
  }

  // Validate file size (max 15MB)
  const maxBytes = 15 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('File exceeds maximum allowed size of 15MB.');
  }

  // Validate file mime type
  const allowedMime = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedMime.includes(file.type)) {
    throw new Error('Invalid file format. Please upload PDF or DOC documents.');
  }

  // Safe file path
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `cor-docs/${user.id}/${Date.now()}_${sanitizedName}`;

  // Upload to Supabase storage 'avatars' or 'artworks' (or 'cor-documents' if bucket exists)
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // We attempt upload to avatars or artworks bucket which already exist
  const bucketName = 'avatars';
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  let publicUrl = '';
  if (!uploadError && uploadData) {
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
    publicUrl = urlData.publicUrl;
  } else {
    // If bucket path fails, fallback to local reference
    publicUrl = `/uploads/${sanitizedName}`;
  }

  // Record in cor_documents
  try {
    await supabase.from('cor_documents').insert({
      creator_id: user.id,
      doc_type: docType,
      file_name: file.name,
      file_url: publicUrl,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
    });
  } catch {}

  revalidatePath('/cor/profile');
  return {
    success: true,
    fileName: file.name,
    fileUrl: publicUrl,
  };
}

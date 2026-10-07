'use server';

import { requireAuth } from '@/lib/security/authGuard';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { SafeIdSchema, ReportReasonSchema, sanitizeText } from '@/lib/security/validators';
import { securityLogger } from '@/lib/security/logger';
import { revalidatePath } from 'next/cache';

export interface SubmitReportInput {
  artworkId: string;
  reporterUserId?: string; // Optional client-passed param, ignored in favor of authenticated session
  artworkOwnerId?: string | null;
  reason: string;
  details?: string | null;
}

export interface SubmitReportResult {
  success: boolean;
  message: string;
  reportId?: string;
}

export async function submitArtworkReport(
  input: SubmitReportInput
): Promise<SubmitReportResult> {
  // 1. Strict Server-Side Authentication
  const { user, supabase } = await requireAuth({ requireActive: true });

  // 2. Rate limit moderation reports: max 5 reports per 15 minutes per user
  const rateLimit = checkRateLimit(`report-submit:${user.id}`, {
    maxRequests: 5,
    windowSeconds: 900,
  });
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: 'Report submission limit reached. Please wait before submitting another report.',
    };
  }

  // 3. Validate Inputs
  const validArtworkId = SafeIdSchema.parse(input.artworkId);
  const validReason = ReportReasonSchema.parse(input.reason);
  const sanitizedDetails = input.details ? sanitizeText(input.details, 2000) : null;
  const validOwnerId = input.artworkOwnerId
    ? SafeIdSchema.safeParse(input.artworkOwnerId).data || null
    : null;

  // 4. Insert report with server-enforced reporter identity
  const { data, error } = await supabase
    .from('reports')
    .insert({
      artwork_id: validArtworkId,
      reporter_user_id: user.id, // Strictly server derived
      artwork_owner_id: validOwnerId,
      reason: validReason,
      details: sanitizedDetails,
      status: 'pending', // Client cannot set approved or resolved
    })
    .select('id')
    .single();

  if (error) {
    securityLogger.error('Moderation report submission failed', {
      userId: user.id,
      artworkId: validArtworkId,
      error: error.message,
    });
    return {
      success: false,
      message: error.message || 'Failed to submit moderation report.',
    };
  }

  securityLogger.info('Artwork moderation report submitted', {
    userId: user.id,
    artworkId: validArtworkId,
    reason: validReason,
  });

  revalidatePath(`/artwork/${validArtworkId}`);
  return {
    success: true,
    message: 'Report Submitted: Thank you for helping keep our community safe.',
    reportId: data?.id,
  };
}

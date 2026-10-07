import { z } from 'zod';

export const REPORT_REASONS = [
  'Possible copyright infringement',
  'Inappropriate / NSFW content',
  'Plagiarism or stolen work',
  'Spam or misleading information',
  'Harassment or hate speech',
  'Other / Policy violation',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  artwork_id: string;
  reporter_user_id: string;
  artwork_owner_id: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
}

// Zod Validation Schemas
export const SafeIdSchema = z.string().uuid({ message: 'Invalid ID format' });

export const ReportReasonSchema = z.enum(REPORT_REASONS, {
  errorMap: () => ({ message: 'Please select a valid report reason' }),
});

export const ReportArtworkSchema = z.object({
  artworkId: SafeIdSchema,
  artworkOwnerId: SafeIdSchema.nullable().optional(),
  reason: ReportReasonSchema,
  details: z
    .string()
    .max(2000, 'Additional details cannot exceed 2000 characters')
    .optional()
    .or(z.literal('')),
});

export type ReportArtworkInput = z.infer<typeof ReportArtworkSchema>;

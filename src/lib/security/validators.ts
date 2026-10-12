import { z } from 'zod';
import type { Artwork, Creator, User, ReportStatus } from '@/lib/types';

/**
 * URL Sanitizer to prevent XSS via javascript: or data: schemes.
 * Only http: and https: protocols are permitted.
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    // If relative path starts with /, allow only if not followed by another / (prevent protocol-relative //evil.com)
    if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
      return trimmed;
    }
    return null;
  }
}

/**
 * Text sanitizer: trims and prevents overly long payloads
 */
export function sanitizeText(text: string | null | undefined, maxLength: number = 5000): string {
  if (!text || typeof text !== 'string') return '';
  return text.trim().slice(0, maxLength);
}

// -------------------------------------------------------------
// Validation Schemas
// -------------------------------------------------------------

export const SafeIdSchema = z.string().uuid('Invalid identifier format');

export const EmailSchema = z
  .string()
  .trim()
  .email('Invalid email address')
  .max(254, 'Email must be under 254 characters')
  .toLowerCase();

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters');

export const RoleSchema = z.enum(['User', 'Creator'], {
  errorMap: () => ({ message: 'Invalid registration role' }),
});

export const ReportReasonSchema = z.enum([
  'Possible copyright infringement',
  'Inappropriate / NSFW content',
  'Plagiarism or stolen work',
  'Spam or misleading information',
  'Harassment or hate speech',
  'Other / Policy violation',
  'Inappropriate content',
  'Incorrect artwork information',
  'Harassment or offensive content',
  'Spam or misleading content',
  'Fraud or scam',
  'Stolen artwork',
  'Other',
]);

export const CreateArtworkSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150, 'Title must not exceed 150 characters'),
  artType: z.string().trim().min(1, 'Medium is required').max(100, 'Medium must not exceed 100 characters'),
  artistName: z.string().trim().min(1, 'Artist name is required').max(150, 'Artist name must not exceed 150 characters'),
  description: z.string().max(5000, 'Description must not exceed 5000 characters').optional().nullable(),
  externalLink: z.string().max(1000).optional().nullable().refine((val) => !val || sanitizeUrl(val) !== null, {
    message: 'External link must be a valid HTTP or HTTPS URL',
  }),
  imageUrl: z.string().min(1, 'Cover image is required').max(2000).refine((val) => sanitizeUrl(val) !== null, {
    message: 'Cover image URL must be a valid HTTP or HTTPS URL',
  }),
  additionalImages: z.array(
    z.string().max(2000).refine((val) => sanitizeUrl(val) !== null, {
      message: 'Image URL must be a valid HTTP or HTTPS URL',
    })
  ).max(10, 'Maximum 10 additional images allowed').optional(),
  price: z.number().min(0, 'Price cannot be negative').max(100000000, 'Price exceeds maximum allowed').optional().nullable(),
  year: z.string().trim().max(10, 'Year must not exceed 10 characters').optional().nullable(),
  dimensions: z.string().trim().max(100, 'Dimensions must not exceed 100 characters').optional().nullable(),
  width: z.string().trim().max(50, 'Width must not exceed 50 characters').optional().nullable(),
  height: z.string().trim().max(50, 'Height must not exceed 50 characters').optional().nullable(),
  location: z.string().trim().max(150, 'Location must not exceed 150 characters').optional().nullable(),
  style: z.string().trim().max(100, 'Style must not exceed 100 characters').optional().nullable(),
  tags: z.array(z.string().trim().max(50)).max(20, 'Maximum 20 tags allowed').optional(),
  collection: z.string().trim().max(150, 'Collection must not exceed 150 characters').optional().nullable(),
  priceVisibility: z.enum(['Show Price', 'Price on Request', 'Hide Price']).optional(),
  status: z.enum(['Available', 'For Sale', 'Not for sale', 'Sold']).optional(),
  isPublished: z.boolean().optional(),
});

export const UpdateArtworkSchema = CreateArtworkSchema.partial();

export const UpdateProfileSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(100, 'Name must not exceed 100 characters'),
  phone_number: z.string().trim().max(30, 'Phone number must not exceed 30 characters').optional().nullable(),
  location_country: z.string().trim().max(100).optional().nullable(),
  location_city: z.string().trim().max(100).optional().nullable(),
  about_me: z.string().max(3000, 'About me must not exceed 3000 characters').optional().nullable(),
  portfolio_url: z.string().max(1000).optional().nullable().refine((val) => !val || sanitizeUrl(val) !== null, {
    message: 'Portfolio URL must be a valid HTTP or HTTPS URL',
  }),
  cover_image_url: z.string().max(2000).optional().nullable().refine((val) => !val || sanitizeUrl(val) !== null, {
    message: 'Cover image must be a valid URL',
  }),
  primary_medium: z.string().trim().max(100).optional().nullable(),
  artist_statement: z.string().max(3000).optional().nullable(),
  art_forms: z.string().max(500).optional().nullable(),
  awards: z.string().max(2000).optional().nullable(),
  other_links: z.string().max(1000).optional().nullable(),
  social_links: z.record(z.string().max(1000)).optional().nullable(),
});

export const MessageSchema = z.object({
  chatId: SafeIdSchema,
  content: z.string().trim().min(1, 'Message cannot be empty').max(3000, 'Message cannot exceed 3000 characters'),
});

export const CreateChatSchema = z.object({
  artworkId: SafeIdSchema,
  creatorId: SafeIdSchema,
  initialMessage: z.string().trim().min(1, 'Initial message is required').max(3000, 'Message cannot exceed 3000 characters'),
});

export const ReportArtworkSchema = z.object({
  artworkId: SafeIdSchema,
  artworkOwnerId: SafeIdSchema.optional().nullable(),
  reason: ReportReasonSchema,
  details: z.string().max(2000, 'Report details must not exceed 2000 characters').optional().nullable(),
});

export const ReportUserSchema = z.object({
  reportedUserId: SafeIdSchema,
  reason: ReportReasonSchema,
  details: z.string().max(2000, 'Report details must not exceed 2000 characters').optional().nullable(),
});

export const JobApplicationSchema = z.object({
  jobId: SafeIdSchema,
  coverLetter: z.string().max(5000, 'Cover letter must not exceed 5000 characters').optional().nullable(),
  portfolioUrl: z.string().max(1000).optional().nullable().refine((val) => !val || sanitizeUrl(val) !== null, {
    message: 'Portfolio URL must be a valid HTTP or HTTPS URL',
  }),
  resumeUrl: z.string().max(1000).optional().nullable().refine((val) => !val || sanitizeUrl(val) !== null, {
    message: 'Resume URL must be a valid HTTP or HTTPS URL',
  }),
});

// -------------------------------------------------------------
// Admin / COR Platform Validators & Sanitizers
// -------------------------------------------------------------

// Valid UUID format regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Valid local/prefixed ID regex (e.g. art_xxx, usr_xxx, rep_xxx)
const PREFIXED_ID_REGEX = /^[a-z]{3}_[a-z0-9_-]{3,64}$/i;

export function isValidId(id: unknown): id is string {
  if (typeof id !== 'string' || !id.trim()) return false;
  const clean = id.trim();
  if (clean.length > 128) return false;
  return UUID_REGEX.test(clean) || PREFIXED_ID_REGEX.test(clean);
}

export const ALLOWED_REPORT_REASONS = [
  'Inappropriate content',
  'Copyright violation',
  'Spam or scam',
  'Misleading information',
  'Harassment or abuse',
  'Other',
] as const;

export function isValidReportReason(reason: string): boolean {
  if (!reason || typeof reason !== 'string') return false;
  return ALLOWED_REPORT_REASONS.includes(reason.trim() as any);
}

export function isValidReportStateTransition(
  currentStatus: ReportStatus,
  targetStatus: ReportStatus
): { valid: boolean; error?: string } {
  const allowedStatuses: ReportStatus[] = ['pending', 'resolved', 'dismissed'];
  if (!allowedStatuses.includes(targetStatus)) {
    return {
      valid: false,
      error: `Invalid target status '${targetStatus}'. Allowed: 'pending', 'resolved', or 'dismissed'.`,
    };
  }

  return { valid: true };
}

export function filterSafeArtworkUpdates(data: Partial<Artwork>): Partial<Artwork> {
  const safe: Partial<Artwork> = {};

  if (typeof data.title === 'string' && data.title.trim()) {
    safe.title = data.title.trim().slice(0, 200);
  }
  if (typeof data.price === 'number' && !isNaN(data.price) && data.price >= 0) {
    safe.price = Number(data.price);
  }
  if (data.status && ['published', 'draft', 'Available', 'For Sale', 'Sold', 'Not for sale', 'rejected', 'pending'].includes(data.status)) {
    safe.status = data.status;
  }
  if (typeof data.dimensions === 'string') {
    safe.dimensions = data.dimensions.trim().slice(0, 100);
  }
  if (typeof data.medium === 'string') {
    safe.medium = data.medium.trim().slice(0, 100);
  }
  if (typeof data.description === 'string') {
    safe.description = data.description.trim().slice(0, 4000);
  }
  if (typeof data.imageUrl === 'string' && data.imageUrl.startsWith('http')) {
    safe.imageUrl = data.imageUrl.trim();
  }
  if (typeof data.isFeatured === 'boolean') {
    safe.isFeatured = data.isFeatured;
  }
  if (typeof data.isFlagged === 'boolean') {
    safe.isFlagged = data.isFlagged;
  }
  if (typeof data.year === 'string') {
    safe.year = data.year.trim().slice(0, 20);
  }
  if (typeof data.location === 'string') {
    safe.location = data.location.trim().slice(0, 100);
  }
  if (typeof data.collection === 'string') {
    safe.collection = data.collection.trim().slice(0, 100);
  }
  if (typeof data.availability === 'string') {
    safe.availability = data.availability.trim().slice(0, 50);
  }

  return safe;
}

export function filterSafeUserUpdates(
  data: Partial<User>,
  options: { allowRoleChange?: boolean } = {}
): Partial<User> {
  const safe: Partial<User> = {};

  if (typeof data.name === 'string' && data.name.trim()) {
    safe.name = data.name.trim().slice(0, 150);
  }

  if (data.status && ['active', 'suspended'].includes(data.status)) {
    safe.status = data.status;
  }

  if (data.plan && ['free', 'pro', 'elite'].includes(data.plan)) {
    safe.plan = data.plan;
  }

  if (options.allowRoleChange && data.role && ['creator', 'collector'].includes(data.role)) {
    safe.role = data.role;
  }

  return safe;
}

export function filterSafeCreatorUpdates(data: Partial<Creator>): Partial<Creator> {
  const safe: Partial<Creator> = {};

  if (typeof data.name === 'string' && data.name.trim()) {
    safe.name = data.name.trim().slice(0, 150);
  }
  if (typeof data.discipline === 'string') {
    safe.discipline = data.discipline.trim().slice(0, 100);
  }
  if (data.status && ['active', 'pending', 'suspended'].includes(data.status)) {
    safe.status = data.status;
  }
  if (data.plan && ['free', 'pro', 'elite'].includes(data.plan)) {
    safe.plan = data.plan;
  }

  return safe;
}

export function sanitizeClientError(error: unknown, fallbackMessage = 'An unexpected error occurred.'): string {
  if (!error) return fallbackMessage;

  const msg = typeof error === 'string' ? error : (error as any)?.message || '';

  const safePhrases = [
    'Unauthorized',
    'Invalid',
    'required',
    'not found',
    'already',
    'exceeded',
    'prohibited',
    'Cannot change status',
    'Please select',
    'Too many attempts',
  ];

  const isSafe = safePhrases.some((phrase) => msg.toLowerCase().includes(phrase.toLowerCase()));

  const isDangerous =
    /select|insert|update|delete|table|column|postgres|supabase|jwt|key|secret|relation|syntax error|null value in column/i.test(
      msg
    );

  if (isSafe && !isDangerous) {
    return msg;
  }

  return fallbackMessage;
}

export function validatePlatformSettings(data: unknown): {
  valid: boolean;
  errors?: Record<string, string>;
  sanitized?: Partial<import('@/lib/types').PlatformSettings>;
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: { general: 'Invalid settings payload.' } };
  }

  const errors: Record<string, string> = {};
  const sanitized: Partial<import('@/lib/types').PlatformSettings> = {};
  const raw = data as Record<string, any>;

  if (raw.freeArtworkLimit !== undefined) {
    const val = Number(raw.freeArtworkLimit);
    if (!Number.isInteger(val) || val < 0) {
      errors.freeArtworkLimit = 'Free artwork limit must be an integer 0 or greater.';
    } else if (val > 10000) {
      errors.freeArtworkLimit = 'Free artwork limit cannot exceed 10,000.';
    } else {
      sanitized.freeArtworkLimit = val;
    }
  }

  if (raw.liteArtworkLimit !== undefined) {
    const val = Number(raw.liteArtworkLimit);
    if (!Number.isInteger(val) || val < 0) {
      errors.liteArtworkLimit = 'Lite artwork limit must be an integer 0 or greater.';
    } else if (val > 10000) {
      errors.liteArtworkLimit = 'Lite artwork limit cannot exceed 10,000.';
    } else {
      sanitized.liteArtworkLimit = val;
    }
  }

  if (raw.proArtworkLimit !== undefined) {
    const val = Number(raw.proArtworkLimit);
    if (!Number.isInteger(val) || val < 0) {
      errors.proArtworkLimit = 'Pro artwork limit must be an integer 0 or greater.';
    } else if (val > 10000) {
      errors.proArtworkLimit = 'Pro artwork limit cannot exceed 10,000.';
    } else {
      sanitized.proArtworkLimit = val;
    }
  }

  if (raw.inviteRequestLimit !== undefined) {
    const val = Number(raw.inviteRequestLimit);
    if (!Number.isInteger(val) || val < 0) {
      errors.inviteRequestLimit = 'Invite request limit must be an integer 0 or greater.';
    } else if (val > 10000) {
      errors.inviteRequestLimit = 'Invite request limit cannot exceed 10,000.';
    } else {
      sanitized.inviteRequestLimit = val;
    }
  }

  if (raw.corEnabled !== undefined) {
    sanitized.corEnabled = Boolean(raw.corEnabled);
  }

  if (raw.featuredCreatorControlsEnabled !== undefined) {
    sanitized.featuredCreatorControlsEnabled = Boolean(raw.featuredCreatorControlsEnabled);
  }

  if (raw.moderationSettingsEnabled !== undefined) {
    sanitized.moderationSettingsEnabled = Boolean(raw.moderationSettingsEnabled);
  }

  if (raw.platformAnnouncement !== undefined) {
    if (typeof raw.platformAnnouncement !== 'string') {
      errors.platformAnnouncement = 'Platform announcement must be text.';
    } else {
      const trimmed = raw.platformAnnouncement.trim();
      if (trimmed.length > 1000) {
        errors.platformAnnouncement = 'Platform announcement cannot exceed 1,000 characters.';
      } else {
        sanitized.platformAnnouncement = trimmed.replace(/<[^>]*>?/gm, '');
      }
    }
  }

  if (raw.defaultProfileVisibility !== undefined) {
    if (raw.defaultProfileVisibility !== 'public' && raw.defaultProfileVisibility !== 'private') {
      errors.defaultProfileVisibility = "Visibility must be 'public' or 'private'.";
    } else {
      sanitized.defaultProfileVisibility = raw.defaultProfileVisibility;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    sanitized: Object.keys(errors).length === 0 ? sanitized : undefined,
  };
}

export const COR_REQUEST_STATUSES = ['pending', 'approved', 'declined'] as const;
export const COR_MEMBER_STATUSES = ['active', 'paused', 'completed', 'removed', 'expired'] as const;
export const COR_OPPORTUNITY_STATUSES = ['open', 'paused', 'closed'] as const;
export const COR_OPPORTUNITY_WORKPLACE_TYPES = ['Remote', 'Hybrid', 'Onsite'] as const;
export const COR_APPLICATION_STATUSES = [
  'Recommended',
  'Preparing Application',
  'Applied',
  'Screening',
  'Interview',
  'Final Round',
  'Offer',
  'Rejected',
] as const;

export function isValidCorRequestStatus(status: unknown): status is (typeof COR_REQUEST_STATUSES)[number] {
  return typeof status === 'string' && COR_REQUEST_STATUSES.includes(status as any);
}

export function isValidCorMemberStatus(status: unknown): status is (typeof COR_MEMBER_STATUSES)[number] {
  return typeof status === 'string' && COR_MEMBER_STATUSES.includes(status as any);
}

export function isValidCorOpportunityStatus(status: unknown): status is (typeof COR_OPPORTUNITY_STATUSES)[number] {
  return typeof status === 'string' && COR_OPPORTUNITY_STATUSES.includes(status as any);
}

export function isValidCorOpportunityWorkplace(type: unknown): type is (typeof COR_OPPORTUNITY_WORKPLACE_TYPES)[number] {
  return typeof type === 'string' && COR_OPPORTUNITY_WORKPLACE_TYPES.includes(type as any);
}

export function isValidCorApplicationStatus(status: unknown): status is (typeof COR_APPLICATION_STATUSES)[number] {
  return typeof status === 'string' && COR_APPLICATION_STATUSES.includes(status as any);
}

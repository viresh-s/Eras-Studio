import { z } from 'zod';

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

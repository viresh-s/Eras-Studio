'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notificationActions';
import { checkFreemiumStatus } from '@/lib/freemium/check';
import { z } from 'zod';

const updateProfileSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  full_name: z.string().min(1, "Name is required").max(100),
  phone_number: z.string().max(20).nullable().optional(),
  location_country: z.string().max(100).nullable().optional(),
  location_city: z.string().max(100).nullable().optional(),
  about_me: z.string().max(1000).nullable().optional(),
  portfolio_url: z.string().url().max(255).or(z.literal("")).nullable().optional(),
  social_links: z.record(z.string()).nullable().optional(),
  cover_image_url: z.string().url().max(500).or(z.literal("")).nullable().optional(),
  primary_medium: z.string().max(100).nullable().optional(),
  artist_statement: z.string().max(2000).nullable().optional(),
  art_forms: z.string().max(500).nullable().optional(),
  awards: z.string().max(1000).nullable().optional(),
  other_links: z.string().max(1000).nullable().optional(),
  artist_bio_file_url: z.string().url().max(1000).or(z.literal("")).nullable().optional(),
  cv_file_url: z.string().url().max(1000).or(z.literal("")).nullable().optional(),
  artist_statement_file_url: z.string().url().max(1000).or(z.literal("")).nullable().optional(),
  short_portfolio_file_url: z.string().url().max(1000).or(z.literal("")).nullable().optional(),
  long_portfolio_file_url: z.string().url().max(1000).or(z.literal("")).nullable().optional(),
  top_artworks_drive_url: z.string().url().max(1000).or(z.literal("")).nullable().optional(),
  has_project_proposals: z.string().max(500).nullable().optional(),
  latest_proposal_file_url: z.string().url().max(1000).or(z.literal("")).nullable().optional(),
});

const uuidSchema = z.string().uuid("Invalid user ID");
const urlSchema = z.string().url("Invalid URL").or(z.literal(""));

interface UpdateProfileData {
  userId: string;
  full_name: string;
  phone_number?: string | null;
  location_country?: string | null;
  location_city?: string | null;
  about_me?: string | null;
  portfolio_url?: string | null;
  social_links?: Record<string, string> | null;
  cover_image_url?: string | null;
  primary_medium?: string | null;
  artist_statement?: string | null;
  art_forms?: string | null;
  awards?: string | null;
  other_links?: string | null;
  artist_bio_file_url?: string | null;
  cv_file_url?: string | null;
  artist_statement_file_url?: string | null;
  short_portfolio_file_url?: string | null;
  long_portfolio_file_url?: string | null;
  top_artworks_drive_url?: string | null;
  has_project_proposals?: string | null;
  latest_proposal_file_url?: string | null;
}

export async function updateProfile(data: UpdateProfileData) {
  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized: Authentication required.');
  }

  // Prevent mass-assignment: strictly destructure from parsed.data (never from raw input data)
  const { userId, ...updateData } = parsed.data;

  if (user.id !== userId) {
    throw new Error('Unauthorized: You can only edit your own profile.');
  }

  // Rate limiting to prevent database abuse
  const { checkRateLimit } = await import('@/lib/security/rateLimiter');
  const rateLimit = checkRateLimit(`profile:update:${user.id}`, { maxRequests: 30, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    throw new Error('Rate limit reached: Please wait before updating your profile again.');
  }

  // Remove undefined values so we don't overwrite with null accidentally
  const cleanedData = Object.fromEntries(
    Object.entries(updateData).filter(([_, v]) => v !== undefined)
  );

  const { error } = await supabase
    .from('profiles')
    .update(cleanedData)
    .eq('id', user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/profile');
  revalidatePath('/user/profile');
}

export async function updateProfileAvatar(userId: string, avatarUrl: string) {
  const parsedUserId = uuidSchema.safeParse(userId);
  const parsedUrl = urlSchema.safeParse(avatarUrl);
  
  if (!parsedUserId.success || !parsedUrl.success) {
    throw new Error('Validation Error: Invalid ID or URL format');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: You can only update your own avatar.');
  }
  
  const { error } = await supabase
    .from('profiles')
    .update({ profile_pic_url: avatarUrl })
    .eq('id', user.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getFreemiumStatusAction(userId: string) {
  const parsedUserId = uuidSchema.safeParse(userId);
  if (!parsedUserId.success) throw new Error('Validation Error: Invalid user ID');
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Enforce caller identity to prevent IDOR
  return await checkFreemiumStatus(user.id);
}

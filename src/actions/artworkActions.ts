'use server';

import { requireAuth } from '@/lib/security/authGuard';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { sanitizeText } from '@/lib/security/validators';
import { securityLogger } from '@/lib/security/logger';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createArtworkSchema = z.object({
  userId: z.string().uuid("Invalid user ID").optional(),
  title: z.string().min(1, "Title is required").max(255),
  artType: z.string().min(1, "Art medium is required").max(100),
  artistName: z.string().max(255),
  description: z.string().max(5000).nullable().optional(),
  externalLink: z.string().url().max(500).or(z.literal("")).nullable().optional(),
  imageUrl: z.string().url("Invalid image URL"),
  additionalImages: z.array(z.string().url()).optional(),
  price: z.number().nonnegative().nullable().optional(),
  year: z.string().max(4).nullable().optional(),
  dimensions: z.string().max(100).nullable().optional(),
  width: z.string().max(50).nullable().optional(),
  height: z.string().max(50).nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  style: z.string().max(100).nullable().optional(),
  tags: z.array(z.string()).optional(),
  collection: z.string().max(100).nullable().optional(),
  priceVisibility: z.string().max(50).nullable().optional(),
  isPublished: z.boolean().optional(),
  status: z.string().max(50).nullable().optional(),
});

const updateArtworkSchema = createArtworkSchema.partial();

const uuidSchema = z.string().uuid("Invalid ID");

export interface CreateArtworkData {
  userId?: string;
  title: string;
  artType: string;
  artistName: string;
  description?: string;
  externalLink?: string;
  imageUrl: string;
  additionalImages?: string[];
  price?: number | null;
  year?: string;
  dimensions?: string;
  width?: string;
  height?: string;
  location?: string;
  style?: string;
  tags?: string[];
  collection?: string;
  priceVisibility?: string;
  isPublished?: boolean;
  status?: string;
}

export async function createArtwork(data: CreateArtworkData) {
  // 1. Strict Server Authentication (Prevents IDOR)
  const { user, supabase } = await requireAuth({ requireActive: true });

  // 2. Rate Limiting (Prevents spam/DDoS)
  const rateLimit = checkRateLimit(`artwork:create:${user.id}`, {
    maxRequests: 30,
    windowSeconds: 3600,
  });
  if (!rateLimit.allowed) {
    securityLogger.alert('RATE_LIMIT_EXCEEDED_ARTWORK_CREATE', { userId: user.id });
    throw new Error('Upload limit reached. Please wait before publishing more pieces.');
  }

  // 3. Schema Validation
  const parsed = createArtworkSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  // 4. Input Sanitization (Prevents Stored XSS)
  const sanitizedTitle = sanitizeText(data.title, 255);
  const sanitizedArtistName = sanitizeText(data.artistName, 255);
  const sanitizedDescription = data.description ? sanitizeText(data.description, 5000) : null;
  const sanitizedLocation = data.location ? sanitizeText(data.location, 100) : null;
  const sanitizedStyle = data.style ? sanitizeText(data.style, 100) : null;
  const sanitizedCollection = data.collection ? sanitizeText(data.collection, 100) : null;

  // 5. Database Insertion with Server-Enforced Creator ID
  const { data: inserted, error } = await supabase
    .from('artworks')
    .insert({
      creator_id: user.id, // Strictly server-derived from auth token
      title: sanitizedTitle,
      art_type: data.artType,
      artist_name: sanitizedArtistName,
      description: sanitizedDescription,
      external_link: data.externalLink || null,
      image_url: data.imageUrl,
      additional_images: data.additionalImages || [],
      price: data.price || null,
      status: data.status || 'Available',
      year: data.year || null,
      dimensions: data.dimensions || null,
      width: data.width || null,
      height: data.height || null,
      location: sanitizedLocation,
      style: sanitizedStyle,
      tags: data.tags || [],
      collection: sanitizedCollection,
      price_visibility: data.priceVisibility || 'Show Price',
      is_published: data.isPublished !== undefined ? data.isPublished : true,
    })
    .select('id')
    .single();

  if (error) {
    securityLogger.alert('ARTWORK_CREATE_DB_ERROR', { userId: user.id, error: error.message });
    throw new Error('Failed to create artwork. Please try again.');
  }

  securityLogger.info('ARTWORK_CREATED', { artworkId: inserted?.id, userId: user.id });

  revalidatePath('/portfolio/artworks');
  revalidatePath('/discovery');
}

export async function deleteArtwork(artworkId: string, _optionalUserId?: string) {
  const { user, supabase } = await requireAuth({ requireActive: true });

  if (!uuidSchema.safeParse(artworkId).success) {
    throw new Error("Validation Error: Invalid artwork ID");
  }

  // Strictly enforce creator_id = user.id from session
  const { error } = await supabase
    .from('artworks')
    .delete()
    .eq('id', artworkId)
    .eq('creator_id', user.id);

  if (error) {
    securityLogger.alert('ARTWORK_DELETE_ERROR', { artworkId, userId: user.id, error: error.message });
    throw new Error('Failed to delete artwork.');
  }

  securityLogger.info('ARTWORK_DELETED', { artworkId, userId: user.id });

  revalidatePath('/portfolio/artworks');
  revalidatePath('/discovery');
}

export async function updateArtwork(artworkId: string, data: Partial<CreateArtworkData> & { status?: string }) {
  const { user, supabase } = await requireAuth({ requireActive: true });

  if (!uuidSchema.safeParse(artworkId).success) {
    throw new Error("Validation Error: Invalid artwork ID");
  }

  const parsed = updateArtworkSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  const updateData: Record<string, any> = {};
  if (data.title !== undefined) updateData.title = sanitizeText(data.title, 255);
  if (data.artType !== undefined) updateData.art_type = data.artType;
  if (data.artistName !== undefined) updateData.artist_name = sanitizeText(data.artistName, 255);
  if (data.description !== undefined) updateData.description = data.description ? sanitizeText(data.description, 5000) : null;
  if (data.externalLink !== undefined) updateData.external_link = data.externalLink || null;
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
  if (data.additionalImages !== undefined) updateData.additional_images = data.additionalImages;
  if (data.price !== undefined) updateData.price = data.price || null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.year !== undefined) updateData.year = data.year || null;
  if (data.dimensions !== undefined) updateData.dimensions = data.dimensions || null;
  if (data.width !== undefined) updateData.width = data.width || null;
  if (data.height !== undefined) updateData.height = data.height || null;
  if (data.location !== undefined) updateData.location = data.location ? sanitizeText(data.location, 100) : null;
  if (data.style !== undefined) updateData.style = data.style ? sanitizeText(data.style, 100) : null;
  if (data.tags !== undefined) updateData.tags = data.tags || [];
  if (data.collection !== undefined) updateData.collection = data.collection ? sanitizeText(data.collection, 100) : null;
  if (data.priceVisibility !== undefined) updateData.price_visibility = data.priceVisibility;
  if (data.isPublished !== undefined) updateData.is_published = data.isPublished;

  // Strictly enforce creator ownership
  const { error } = await supabase
    .from('artworks')
    .update(updateData)
    .eq('id', artworkId)
    .eq('creator_id', user.id);

  if (error) {
    securityLogger.alert('ARTWORK_UPDATE_ERROR', { artworkId, userId: user.id, error: error.message });
    throw new Error('Failed to update artwork.');
  }

  securityLogger.info('ARTWORK_UPDATED', { artworkId, userId: user.id });

  revalidatePath('/portfolio/artworks');
  revalidatePath(`/artwork/${artworkId}`);
  revalidatePath('/discovery');
}

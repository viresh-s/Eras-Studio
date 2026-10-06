'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createArtworkSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
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
  location: z.string().max(100).nullable().optional(),
  style: z.string().max(100).nullable().optional(),
  tags: z.array(z.string()).optional(),
  collection: z.string().max(100).nullable().optional(),
  priceVisibility: z.string().max(50).nullable().optional(),
  isPublished: z.boolean().optional(),
  status: z.string().max(50).nullable().optional(),
});

const updateArtworkSchema = createArtworkSchema.partial().extend({
  userId: z.string().uuid("Invalid user ID"),
});

const uuidSchema = z.string().uuid("Invalid ID");

interface CreateArtworkData {
  userId: string;
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
  location?: string;
  style?: string;
  tags?: string[];
  collection?: string;
  priceVisibility?: string;
  isPublished?: boolean;
  status?: string;
}

export async function createArtwork(data: CreateArtworkData) {
  const parsed = createArtworkSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('artworks')
    .insert({
      creator_id: data.userId,
      title: data.title,
      art_type: data.artType, // Still using art_type in DB for backwards compatibility, mapped to Medium in UI
      artist_name: data.artistName,
      description: data.description || null,
      external_link: data.externalLink || null,
      image_url: data.imageUrl,
      additional_images: data.additionalImages || [],
      price: data.price || null,
      status: data.status || 'Available',
      year: data.year || null,
      dimensions: data.dimensions || null,
      location: data.location || null,
      style: data.style || null,
      tags: data.tags || [],
      collection: data.collection || null,
      price_visibility: data.priceVisibility || 'Show Price',
      is_published: data.isPublished !== undefined ? data.isPublished : true,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/portfolio/artworks');
}

export async function deleteArtwork(artworkId: string, userId: string) {
  if (!uuidSchema.safeParse(artworkId).success || !uuidSchema.safeParse(userId).success) {
    throw new Error("Validation Error: Invalid ID");
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from('artworks')
    .delete()
    .eq('id', artworkId)
    .eq('creator_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/portfolio/artworks');
}

export async function updateArtwork(artworkId: string, data: Partial<CreateArtworkData> & { status?: string }) {
  if (!uuidSchema.safeParse(artworkId).success) throw new Error("Validation Error: Invalid artwork ID");
  
  const parsed = updateArtworkSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  const supabase = await createClient();
  
  if (!data.userId) throw new Error("Unauthorized");

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.artType !== undefined) updateData.art_type = data.artType;
  if (data.artistName !== undefined) updateData.artist_name = data.artistName;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.externalLink !== undefined) updateData.external_link = data.externalLink || null;
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
  if (data.additionalImages !== undefined) updateData.additional_images = data.additionalImages;
  if (data.price !== undefined) updateData.price = data.price || null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.year !== undefined) updateData.year = data.year || null;
  if (data.dimensions !== undefined) updateData.dimensions = data.dimensions || null;
  if (data.location !== undefined) updateData.location = data.location || null;
  if (data.style !== undefined) updateData.style = data.style || null;
  if (data.tags !== undefined) updateData.tags = data.tags || [];
  if (data.collection !== undefined) updateData.collection = data.collection || null;
  if (data.priceVisibility !== undefined) updateData.price_visibility = data.priceVisibility;
  if (data.isPublished !== undefined) updateData.is_published = data.isPublished;

  const { error } = await supabase
    .from('artworks')
    .update(updateData)
    .eq('id', artworkId)
    .eq('creator_id', data.userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/portfolio/artworks');
  revalidatePath(`/artwork/${artworkId}`);
}

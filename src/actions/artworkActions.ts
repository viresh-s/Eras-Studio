'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

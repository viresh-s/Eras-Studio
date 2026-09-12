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
  price?: number | null;
}

export async function createArtwork(data: CreateArtworkData) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('artworks')
    .insert({
      creator_id: data.userId,
      title: data.title,
      art_type: data.artType,
      artist_name: data.artistName,
      description: data.description || null,
      external_link: data.externalLink || null,
      image_url: data.imageUrl,
      price: data.price || null,
      status: 'Available',
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/creator/artworks');
}

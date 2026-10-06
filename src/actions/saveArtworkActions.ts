'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const uuidSchema = z.string().uuid("Invalid artwork ID");

export async function toggleSaveArtwork(artworkId: string, isSaved: boolean) {
  if (!uuidSchema.safeParse(artworkId).success) throw new Error("Validation Error: Invalid artwork ID");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be logged in to save artworks.');
  }

  if (isSaved) {
    // Unsave
    const { error } = await supabase
      .from('saved_artworks')
      .delete()
      .eq('artwork_id', artworkId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);
  } else {
    // Save
    const { error } = await supabase
      .from('saved_artworks')
      .insert({ artwork_id: artworkId, user_id: user.id });

    if (error) throw new Error(error.message);
  }

  revalidatePath(`/artwork/${artworkId}`);
  revalidatePath('/saved');
}

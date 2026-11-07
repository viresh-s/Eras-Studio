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

    // Sync likes_count on artworks table if column exists
    try {
      const { count } = await supabase
        .from('saved_artworks')
        .select('*', { count: 'exact', head: true })
        .eq('artwork_id', artworkId);

      await (supabase as any)
        .from('artworks')
        .update({ likes_count: count ?? 0 })
        .eq('id', artworkId);
    } catch {
      // Non-blocking if column not yet added
    }
  } else {
    // Save
    const { error } = await supabase
      .from('saved_artworks')
      .insert({ artwork_id: artworkId, user_id: user.id });

    if (error) throw new Error(error.message);

    // Sync likes_count on artworks table if column exists
    try {
      const { count } = await supabase
        .from('saved_artworks')
        .select('*', { count: 'exact', head: true })
        .eq('artwork_id', artworkId);

      await (supabase as any)
        .from('artworks')
        .update({ likes_count: count ?? 1 })
        .eq('id', artworkId);
    } catch {
      // Non-blocking if column not yet added
    }
  }

  revalidatePath(`/artwork/${artworkId}`);
  revalidatePath('/purchases');
  revalidatePath('/portfolio');
  revalidatePath('/discovery');
}

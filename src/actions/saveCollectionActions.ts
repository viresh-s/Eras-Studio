'use server';

import { createClient, getSupabaseAdmin } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid collection ID');

/**
 * Toggle like/save for an entire collection.
 */
export async function toggleSaveCollection(collectionId: string, isSaved: boolean) {
  if (!uuidSchema.safeParse(collectionId).success) {
    throw new Error('Validation Error: Invalid collection ID');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be logged in to like or save collections.');
  }

  const admin = getSupabaseAdmin();
  const client: any = admin || supabase;

  if (isSaved) {
    // Unsave/Unlike
    try {
      await client
        .from('saved_collections')
        .delete()
        .eq('collection_id', collectionId)
        .eq('user_id', user.id);
    } catch {
      // Non-blocking if table is pending
    }

    // Sync likes_count on collections table
    try {
      const { count } = await client
        .from('saved_collections')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', collectionId);

      await client
        .from('collections')
        .update({ likes_count: Math.max(0, count ?? 0) })
        .eq('id', collectionId);
    } catch {
      // Non-blocking if column not added yet
    }
  } else {
    // Save/Like
    try {
      await client
        .from('saved_collections')
        .insert({ collection_id: collectionId, user_id: user.id });
    } catch {
      // Non-blocking if table is pending
    }

    // Sync likes_count on collections table
    try {
      const { count } = await client
        .from('saved_collections')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', collectionId);

      await client
        .from('collections')
        .update({ likes_count: count ?? 1 })
        .eq('id', collectionId);
    } catch {
      // Non-blocking if column not added yet
    }
  }

  revalidatePath('/portfolio/collections');
  revalidatePath('/portfolio');
}

/**
 * Check if the current user has saved/liked a specific collection.
 */
export async function checkIsCollectionSaved(collectionId: string): Promise<boolean> {
  if (!collectionId || !uuidSchema.safeParse(collectionId).success) return false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data } = await supabase
      .from('saved_collections')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('user_id', user.id)
      .maybeSingle();

    return Boolean(data);
  } catch {
    return false;
  }
}

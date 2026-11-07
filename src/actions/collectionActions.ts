'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sanitizeText } from '@/lib/security/validators';

export interface CollectionItem {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
  artwork_count?: number;
  artworks?: any[];
}

const CreateCollectionSchema = z.object({
  title: z.string().min(1, 'Collection title is required').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional().nullable(),
  cover_image_url: z.string().url().optional().nullable().or(z.literal('')),
  is_published: z.boolean().optional().default(true),
});

const UpdateCollectionSchema = z.object({
  title: z.string().min(1, 'Collection title is required').max(100, 'Title cannot exceed 100 characters').optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional().nullable(),
  cover_image_url: z.string().url().optional().nullable().or(z.literal('')),
  is_published: z.boolean().optional(),
});

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    return createSupabaseClient(url, key);
  }
  return null;
}

/**
 * Get all collections for a specific creator, enriched with artwork counts
 */
export async function getCreatorCollections(creatorId?: string): Promise<CollectionItem[]> {
  const supabase = await createClient();
  let targetId = creatorId;

  if (!targetId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    targetId = user.id;
  }

  const adminClient = getAdminClient();
  const dbClient = adminClient || supabase;

  try {
    // 1. Attempt query from collections table
    const { data: collections, error } = await dbClient
      .from('collections')
      .select('*')
      .eq('creator_id', targetId)
      .order('created_at', { ascending: false });

    if (!error && collections) {
      // Fetch artworks count per collection
      const { data: artworks } = await dbClient
        .from('artworks')
        .select('id, collection_id, collection, image_url, title, year, price, art_type, status, is_published')
        .eq('creator_id', targetId);

      const items: CollectionItem[] = collections.map((col) => {
        const matchingArtworks = (artworks || []).filter(
          (a) => a.collection_id === col.id || (a.collection && a.collection.trim().toLowerCase() === col.title.trim().toLowerCase())
        );
        const autoCover = col.cover_image_url || matchingArtworks[0]?.image_url || null;
        return {
          ...col,
          cover_image_url: autoCover,
          artwork_count: matchingArtworks.length,
          artworks: matchingArtworks,
        };
      });

      return items;
    }
  } catch (err) {
    console.warn('collections table query failed, falling back to text collections:', err);
  }

  // 2. Graceful Fallback: extract distinct text collections from artworks table
  try {
    const { data: artworks } = await dbClient
      .from('artworks')
      .select('id, collection, image_url, created_at')
      .eq('creator_id', targetId);

    if (!artworks) return [];

    const grouped: { [name: string]: { count: number; cover: string | null; date: string } } = {};
    for (const art of artworks) {
      const colName = art.collection?.trim();
      if (!colName || colName.toLowerCase() === 'other') continue;
      if (!grouped[colName]) {
        grouped[colName] = { count: 0, cover: art.image_url || null, date: art.created_at };
      }
      grouped[colName].count += 1;
    }

    return Object.entries(grouped).map(([title, info]) => ({
      id: title, // Use title as synthetic ID when table is pending
      creator_id: targetId!,
      title,
      description: null,
      cover_image_url: info.cover,
      is_published: true,
      created_at: info.date,
      artwork_count: info.count,
    }));
  } catch {
    return [];
  }
}

/**
 * Create a new standalone collection
 */
export async function createCollection(input: {
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  is_published?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  const parsed = CreateCollectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid collection input' };
  }

  const sanitizedTitle = sanitizeText(parsed.data.title.trim(), 100);
  const sanitizedDesc = parsed.data.description ? sanitizeText(parsed.data.description.trim(), 1000) : null;

  const adminClient = getAdminClient();
  const dbClient = adminClient || supabase;

  try {
    const { data: collection, error } = await dbClient
      .from('collections')
      .insert({
        creator_id: user.id,
        title: sanitizedTitle,
        description: sanitizedDesc,
        cover_image_url: parsed.data.cover_image_url || null,
        is_published: parsed.data.is_published ?? true,
      })
      .select('*')
      .single();

    if (error) {
      // If table does not exist, return a fallback synthetic collection object
      return {
        success: true,
        collection: {
          id: sanitizedTitle,
          creator_id: user.id,
          title: sanitizedTitle,
          description: sanitizedDesc,
          cover_image_url: parsed.data.cover_image_url || null,
          is_published: true,
          created_at: new Date().toISOString(),
          artwork_count: 0,
        },
      };
    }

    revalidatePath('/portfolio');
    revalidatePath('/portfolio/collections');
    revalidatePath('/portfolio/artworks');
    revalidatePath(`/artist/${user.id}`);

    return { success: true, collection };
  } catch (err: any) {
    return {
      success: true,
      collection: {
        id: sanitizedTitle,
        creator_id: user.id,
        title: sanitizedTitle,
        description: sanitizedDesc,
        cover_image_url: parsed.data.cover_image_url || null,
        is_published: true,
        created_at: new Date().toISOString(),
        artwork_count: 0,
      },
    };
  }
}

/**
 * Update an existing collection
 */
export async function updateCollection(
  id: string,
  input: {
    title?: string;
    description?: string | null;
    cover_image_url?: string | null;
    is_published?: boolean;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const parsed = UpdateCollectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const updateData: any = { updated_at: new Date().toISOString() };
  if (parsed.data.title !== undefined) {
    updateData.title = sanitizeText(parsed.data.title.trim(), 100);
  }
  if (parsed.data.description !== undefined) {
    updateData.description = parsed.data.description ? sanitizeText(parsed.data.description.trim(), 1000) : null;
  }
  if (parsed.data.cover_image_url !== undefined) {
    updateData.cover_image_url = parsed.data.cover_image_url || null;
  }
  if (parsed.data.is_published !== undefined) {
    updateData.is_published = parsed.data.is_published;
  }

  const adminClient = getAdminClient();
  const dbClient = adminClient || supabase;

  try {
    const { data: updated, error } = await dbClient
      .from('collections')
      .update(updateData)
      .eq('id', id)
      .eq('creator_id', user.id)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // If title was updated, also update artworks with matching collection_id or name
    if (updateData.title) {
      await dbClient
        .from('artworks')
        .update({ collection: updateData.title })
        .eq('creator_id', user.id)
        .eq('collection_id', id);
    }

    revalidatePath('/portfolio');
    revalidatePath('/portfolio/collections');
    revalidatePath('/portfolio/artworks');
    revalidatePath(`/artist/${user.id}`);

    return { success: true, collection: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Update failed' };
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const adminClient = getAdminClient();
  const dbClient = adminClient || supabase;

  try {
    // 1. Disassociate artworks
    await dbClient
      .from('artworks')
      .update({ collection_id: null, collection: null })
      .eq('creator_id', user.id)
      .eq('collection_id', id);

    // 2. Delete collection
    const { error } = await dbClient
      .from('collections')
      .delete()
      .eq('id', id)
      .eq('creator_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/portfolio');
    revalidatePath('/portfolio/collections');
    revalidatePath('/portfolio/artworks');
    revalidatePath(`/artist/${user.id}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Delete failed' };
  }
}

/**
 * Assign or remove an artwork from a collection
 */
export async function assignArtworkToCollection(
  artworkId: string,
  collectionIdOrTitle: string | null,
  collectionTitle?: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const adminClient = getAdminClient();
  const dbClient = adminClient || supabase;

  try {
    // If removing from collection
    if (!collectionIdOrTitle || collectionIdOrTitle === 'none' || collectionIdOrTitle === '') {
      await dbClient
        .from('artworks')
        .update({
          collection_id: null,
          collection: null,
        })
        .eq('id', artworkId)
        .eq('creator_id', user.id);

      revalidatePath('/portfolio');
      revalidatePath('/portfolio/collections');
      revalidatePath('/portfolio/artworks');
      revalidatePath(`/artist/${user.id}`);
      revalidatePath(`/artwork/${artworkId}`);
      return { success: true };
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(collectionIdOrTitle);

    let resolvedId: string | null = null;
    let resolvedTitle: string | null = collectionTitle || null;

    if (isUUID) {
      resolvedId = collectionIdOrTitle;
      if (!resolvedTitle) {
        const { data: col } = await dbClient
          .from('collections')
          .select('title')
          .eq('id', resolvedId)
          .maybeSingle();
        if (col) resolvedTitle = col.title;
      }
    } else {
      // It's a title
      const targetTitle = (collectionTitle || collectionIdOrTitle).trim();
      const { data: existingCol } = await dbClient
        .from('collections')
        .select('id, title')
        .eq('creator_id', user.id)
        .ilike('title', targetTitle)
        .maybeSingle();

      if (existingCol) {
        resolvedId = existingCol.id;
        resolvedTitle = existingCol.title;
      } else {
        const { data: newCol } = await dbClient
          .from('collections')
          .insert({
            creator_id: user.id,
            title: targetTitle,
            is_published: true,
          })
          .select('id, title')
          .single();

        if (newCol) {
          resolvedId = newCol.id;
          resolvedTitle = newCol.title;
        }
      }
    }

    const { error } = await dbClient
      .from('artworks')
      .update({
        collection_id: resolvedId,
        collection: resolvedTitle,
      })
      .eq('id', artworkId)
      .eq('creator_id', user.id);

    if (error) {
      console.error('Failed to update artwork collection:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/portfolio');
    revalidatePath('/portfolio/collections');
    revalidatePath('/portfolio/artworks');
    revalidatePath(`/artist/${user.id}`);
    revalidatePath(`/artwork/${artworkId}`);

    return { success: true, collectionId: resolvedId, title: resolvedTitle };
  } catch (err: any) {
    console.error('Failed to assign artwork to collection:', err);
    return { success: false, error: err?.message || 'Failed to assign collection' };
  }
}


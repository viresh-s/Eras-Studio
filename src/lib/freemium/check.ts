import { createClient } from '@/lib/supabase/server';

export interface FreemiumStatus {
  isLocked: boolean;
  reason: string;
  daysRemaining: number;
  artworksUsed: number;
  artworksLimit: number;
}

export async function checkFreemiumStatus(userId: string): Promise<FreemiumStatus> {
  const supabase = await createClient();

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, created_at')
    .eq('id', userId)
    .single();

  if (!profile) {
    return {
      isLocked: true,
      reason: 'Profile not found',
      daysRemaining: 0,
      artworksUsed: 0,
      artworksLimit: 3,
    };
  }

  // Premium users are never locked
  if (profile.is_premium) {
    return {
      isLocked: false,
      reason: '',
      daysRemaining: -1,
      artworksUsed: 0,
      artworksLimit: -1,
    };
  }

  // Count artworks
  const { count } = await supabase
    .from('artworks')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', userId);

  const artworksUsed = count || 0;
  const isArtworkLocked = artworksUsed >= 3;

  if (isArtworkLocked) {
    return {
      isLocked: true,
      reason: 'You\'ve used all 3 free uploads. Upgrade to Premium for unlimited uploads.',
      daysRemaining: -1,
      artworksUsed,
      artworksLimit: 3,
    };
  }

  return {
    isLocked: false,
    reason: '',
    daysRemaining: -1,
    artworksUsed,
    artworksLimit: 3,
  };
}

export async function upgradeToPremium(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({ is_premium: true })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

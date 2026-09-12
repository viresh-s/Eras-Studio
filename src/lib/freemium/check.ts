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

  // Check time since creation
  const createdAt = new Date(profile.created_at);
  const now = new Date();
  const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 10 - daysSinceCreation);

  // Lock if either condition is met
  const isTimeLocked = daysSinceCreation > 10;
  const isArtworkLocked = artworksUsed >= 3;

  if (isTimeLocked && isArtworkLocked) {
    return {
      isLocked: true,
      reason: 'Your free trial has ended and you\'ve used all 3 free uploads. Upgrade to Premium to continue.',
      daysRemaining: 0,
      artworksUsed,
      artworksLimit: 3,
    };
  }

  if (isTimeLocked) {
    return {
      isLocked: true,
      reason: 'Your 10-day free trial has ended. Upgrade to Premium to continue uploading.',
      daysRemaining: 0,
      artworksUsed,
      artworksLimit: 3,
    };
  }

  if (isArtworkLocked) {
    return {
      isLocked: true,
      reason: 'You\'ve used all 3 free uploads. Upgrade to Premium for unlimited uploads.',
      daysRemaining,
      artworksUsed,
      artworksLimit: 3,
    };
  }

  return {
    isLocked: false,
    reason: '',
    daysRemaining,
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

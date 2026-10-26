import { createClient } from '@/lib/supabase/server';

export interface FreemiumStatus {
  isLocked: boolean;
  reason: string;
  daysRemaining: number;
  artworksUsed: number;
  artworksLimit: number;
}

export function evaluateFreemiumStatus(profile: any, artworksUsed: number): FreemiumStatus {
  if (!profile) {
    return {
      isLocked: true,
      reason: 'Profile not found',
      daysRemaining: 0,
      artworksUsed: 0,
      artworksLimit: 3,
    };
  }

  // Premium or Pro users are never locked
  const isPro = Boolean(profile.is_premium || profile.plan === 'pro' || profile.plan === 'elite');
  if (isPro) {
    return {
      isLocked: false,
      reason: '',
      daysRemaining: -1,
      artworksUsed: 0,
      artworksLimit: -1,
    };
  }

  const isLite = profile.plan === 'lite' || profile.plan === 'light';
  const limit = isLite ? 50 : 3;
  const isArtworkLocked = artworksUsed >= limit;

  if (isArtworkLocked) {
    return {
      isLocked: true,
      reason: isLite
        ? 'You have reached the 50-artwork allowance of your Lite plan. Upgrade to Pro for unlimited uploads.'
        : 'You have reached the 3-artwork limit of your Free plan. Upgrade to Lite (50 artworks) or Pro (unlimited) to exhibit more work.',
      daysRemaining: -1,
      artworksUsed,
      artworksLimit: limit,
    };
  }

  return {
    isLocked: false,
    reason: '',
    daysRemaining: -1,
    artworksUsed,
    artworksLimit: limit,
  };
}

export async function checkFreemiumStatus(userId: string): Promise<FreemiumStatus> {
  const supabase = await createClient();

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, plan, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    return {
      isLocked: true,
      reason: 'Profile not found',
      daysRemaining: 0,
      artworksUsed: 0,
      artworksLimit: 3,
    };
  }

  // Count artworks
  const { count } = await supabase
    .from('artworks')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', userId);

  return evaluateFreemiumStatus(profile, count || 0);
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

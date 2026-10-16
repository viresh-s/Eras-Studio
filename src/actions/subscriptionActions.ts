'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export type PlanTier = 'free' | 'lite' | 'pro';

/**
 * Server action to update user subscription tier
 * Supports free, lite, and pro tiers (ready for Razorpay webhooks in future)
 */
export async function upgradeUserPlanAction(targetPlan: PlanTier): Promise<{
  success: boolean;
  plan?: PlanTier;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User is not authenticated.' };
    }

    const adminClient = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const isPremium = targetPlan === 'pro';

    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        plan: targetPlan,
        is_premium: isPremium,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update plan in profiles:', updateError);
      return { success: false, error: updateError.message };
    }

    // Revalidate affected pages
    revalidatePath('/subscription');
    revalidatePath('/cor');
    revalidatePath('/portfolio');
    revalidatePath('/profile');
    revalidatePath('/settings');
    revalidatePath('/discovery');

    return {
      success: true,
      plan: targetPlan,
    };
  } catch (error: any) {
    console.error('upgradeUserPlanAction error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update subscription tier.',
    };
  }
}

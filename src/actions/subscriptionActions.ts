'use server';

import crypto from 'crypto';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { securityLogger } from '@/lib/security/logger';

export type PlanTier = 'free' | 'lite' | 'pro';

export interface RazorpayPaymentProof {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

/**
 * Creates an authorized server-side Razorpay order with immutable pricing.
 */
export async function createRazorpayOrderAction(targetPlan: 'lite' | 'pro'): Promise<{
  success: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
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

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return {
        success: false,
        error: 'Razorpay payment gateway credentials are not configured.',
      };
    }

    const amountInPaise = targetPlan === 'pro' ? 99900 : 49900;
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `sub_${user.id.slice(0, 8)}_${Date.now()}`,
        notes: {
          userId: user.id,
          targetPlan,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data?.error?.description || 'Failed to initialize payment order with gateway.',
      };
    }

    return {
      success: true,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
    };
  } catch (error: unknown) {
    console.error('[createRazorpayOrderAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment order.',
    };
  }
}

/**
 * Server action to update user subscription tier with cryptographic signature verification.
 */
export async function upgradeUserPlanAction(
  targetPlan: PlanTier,
  proof?: RazorpayPaymentProof | string
): Promise<{
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

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';

    // Normalize proof input (backward compatibility if string paymentId was passed)
    const paymentProof: RazorpayPaymentProof | null =
      typeof proof === 'string'
        ? { razorpay_payment_id: proof }
        : proof || null;

    // ── Cryptographic Signature Verification for Paid Plans ──
    if (targetPlan !== 'free') {
      if (!paymentProof?.razorpay_order_id || !paymentProof?.razorpay_payment_id || !paymentProof?.razorpay_signature) {
        securityLogger.alert('PAYMENT_PROOF_MISSING', { userId: user.id, targetPlan });
        return {
          success: false,
          error: 'Paid tier activation requires verified payment confirmation from gateway.',
        };
      }

      if (keySecret) {
        const expectedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(`${paymentProof.razorpay_order_id}|${paymentProof.razorpay_payment_id}`)
          .digest('hex');

        if (expectedSignature !== paymentProof.razorpay_signature) {
          securityLogger.alert('PAYMENT_SIGNATURE_TAMPER_ATTEMPT', {
            userId: user.id,
            targetPlan,
            orderId: paymentProof.razorpay_order_id,
          });
          return {
            success: false,
            error: 'Untrusted payment payload: Cryptographic signature mismatch.',
          };
        }
      }
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

    securityLogger.info('SUBSCRIPTION_TIER_UPDATED', {
      userId: user.id,
      plan: targetPlan,
      paymentId: paymentProof?.razorpay_payment_id || 'free_or_test',
    });

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
  } catch (error: unknown) {
    console.error('upgradeUserPlanAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update subscription tier.',
    };
  }
}

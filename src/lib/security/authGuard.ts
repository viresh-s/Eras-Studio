import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import type { Profile } from '@/types/database';
import { securityLogger } from './logger';

export interface AuthenticatedContext {
  user: {
    id: string;
    email?: string;
  };
  profile: Profile;
  ip: string;
  supabase: SupabaseClient<any, 'public', any>;
}

export interface RequireAuthOptions {
  requireActive?: boolean;
}

export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    const realIp = headerList.get('x-real-ip');
    if (realIp) return realIp.trim();
  } catch {
    // If called outside of request context
  }
  return '127.0.0.1';
}

function isSupabaseClient(arg: any): arg is SupabaseClient {
  return arg && typeof arg === 'object' && 'auth' in arg && 'from' in arg;
}

/**
 * Ensures the caller is authenticated and account is active.
 * Rejects unauthenticated callers, invalid tokens, or suspended accounts.
 */
export async function requireAuth(
  clientOrOptions?: SupabaseClient | RequireAuthOptions,
  maybeOptions?: RequireAuthOptions
): Promise<AuthenticatedContext> {
  let supabase: SupabaseClient;
  let options: RequireAuthOptions;

  if (isSupabaseClient(clientOrOptions)) {
    supabase = clientOrOptions;
    options = maybeOptions || { requireActive: true };
  } else {
    supabase = await createClient();
    options = clientOrOptions || { requireActive: true };
  }

  const ip = await getClientIp();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    securityLogger.audit('UNAUTHORIZED_ACCESS_ATTEMPT', { ip });
    throw new Error('Authentication required. Please sign in to proceed.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    securityLogger.audit('PROFILE_LOOKUP_FAILED', { userId: user.id, ip });
    throw new Error('User profile could not be verified.');
  }

  // Account suspension check
  if (options.requireActive !== false && profile.status === 'suspended') {
    securityLogger.alert('SUSPENDED_USER_ACTION_BLOCKED', { userId: user.id, ip });
    throw new Error('Your account is currently suspended. Action not permitted.');
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profile as Profile,
    ip,
    supabase,
  };
}

/**
 * Ensures the caller is a verified Creator or Admin.
 */
export async function requireCreator(
  clientOrOptions?: SupabaseClient | RequireAuthOptions,
  maybeOptions?: RequireAuthOptions
): Promise<AuthenticatedContext> {
  const context = await requireAuth(clientOrOptions, maybeOptions);

  if (context.profile.role !== 'Creator' && context.profile.role !== 'Admin') {
    securityLogger.alert('FORBIDDEN_CREATOR_ROLE_ATTEMPT', {
      userId: context.user.id,
      ip: context.ip,
      role: context.profile.role,
    });
    throw new Error('Access denied. Creator privileges required.');
  }

  return context;
}

/**
 * Ensures the caller is an Administrator.
 */
export async function requireAdmin(
  clientOrOptions?: SupabaseClient | RequireAuthOptions,
  maybeOptions?: RequireAuthOptions
): Promise<AuthenticatedContext> {
  const context = await requireAuth(clientOrOptions, maybeOptions);

  if (context.profile.role !== 'Admin') {
    securityLogger.alert('FORBIDDEN_ADMIN_ACCESS_ATTEMPT', {
      userId: context.user.id,
      ip: context.ip,
      role: context.profile.role,
    });
    throw new Error('Access denied. Administrator privileges required.');
  }

  return context;
}

/**
 * Checks whether a given profile has active Pro or Elite membership tier.
 */
export function isProUser(profile: Partial<Profile> | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === 'Admin') return true;
  return profile.plan === 'pro' || profile.plan === 'elite' || profile.is_premium === true;
}

/**
 * Ensures the caller has active Pro, Elite, or Admin entitlement.
 */
export async function requirePro(
  clientOrOptions?: SupabaseClient | RequireAuthOptions,
  maybeOptions?: RequireAuthOptions
): Promise<AuthenticatedContext> {
  const context = await requireAuth(clientOrOptions, maybeOptions);

  if (!isProUser(context.profile)) {
    securityLogger.alert('FORBIDDEN_PRO_TIER_ATTEMPT', {
      userId: context.user.id,
      ip: context.ip,
      role: context.profile.role,
      plan: context.profile.plan,
    });
    throw new Error('Access denied. Active ErasStudio® Pro or Elite membership tier required.');
  }

  return context;
}


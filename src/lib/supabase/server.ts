import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseJsClient, SupabaseClient, type User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './types';
import type { Profile } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Checks whether Supabase environment variables are properly configured.
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl) return false;
  if (supabaseUrl.includes('your_supabase') || supabaseUrl.includes('your-project')) return false;
  return Boolean(supabaseServiceRoleKey || supabaseAnonKey);
}

let serverClientInstance: SupabaseClient<Database> | null = null;

/**
 * Server-side Supabase client for Server Components, Server Actions, and Repositories.
 * Uses the Service Role Key if available (bypasses RLS for full admin control),
 * or falls back to Anon Key.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (serverClientInstance) {
    return serverClientInstance;
  }

  const key = supabaseServiceRoleKey || supabaseAnonKey;
  if (!key || !supabaseUrl) {
    return null;
  }

  serverClientInstance = createSupabaseJsClient<Database>(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        return fetch(url, {
          ...options,
          signal: options.signal || controller.signal,
        }).finally(() => clearTimeout(timeout));
      },
    },
  });

  return serverClientInstance;
}

/**
 * SSR Supabase client using cookies for authenticated user actions.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Memoized authenticated user fetch for the current request lifecycle.
 * Deduplicates auth.getUser() calls across layout and pages during a single navigation.
 */
export const getAuthenticatedUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
});

/**
 * Memoized profile fetch for the current request lifecycle.
 * Prevents duplicate profile queries across layout and child page components.
 */
export const getAuthenticatedProfile = cache(async (userId?: string): Promise<Profile | null> => {
  try {
    const user = userId ? { id: userId } : await getAuthenticatedUser();
    if (!user) return null;
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    return (profile as Profile | null) || null;
  } catch {
    return null;
  }
});

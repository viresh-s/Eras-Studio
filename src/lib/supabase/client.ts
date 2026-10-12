import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isBrowserSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('your_supabase')
);

export function createClient() {
  return createBrowserClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
  );
}

/**
 * Browser-side Supabase client singleton for Client Components.
 */
export const supabase = isBrowserSupabaseConfigured
  ? createSupabaseJsClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null;

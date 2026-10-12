import { createClient } from '@/lib/supabase/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // User must be redirected to login page after email verification
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?verified=true`);
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (!error) {
      // Sign out auto-session so the user logs in as requested
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?verified=true`);
    }
  }

  // Redirect to login page with verified state
  return NextResponse.redirect(`${origin}/login?verified=true`);
}

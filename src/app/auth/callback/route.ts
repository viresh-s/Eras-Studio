import { createClient } from '@/lib/supabase/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');

  const supabase = await createClient();

  const isPasswordRecovery = type === 'recovery' || (Boolean(next) && next!.includes('forgot-password'));

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (isPasswordRecovery) {
        // Keep recovery session active so user can update their password
        return NextResponse.redirect(`${origin}/forgot-password?mode=reset`);
      }
      // User requested login redirect after email verification
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
      if (isPasswordRecovery) {
        return NextResponse.redirect(`${origin}/forgot-password?mode=reset`);
      }
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?verified=true`);
    }
  }

  if (isPasswordRecovery) {
    return NextResponse.redirect(`${origin}/forgot-password?mode=reset`);
  }

  // Redirect to login page with verified state
  return NextResponse.redirect(`${origin}/login?verified=true`);
}

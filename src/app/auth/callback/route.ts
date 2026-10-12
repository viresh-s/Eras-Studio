import { createServerClient } from '@supabase/ssr';
import { type EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');

  const isPasswordRecovery = type === 'recovery' || (Boolean(next) && next!.includes('forgot-password'));
  const redirectTarget = isPasswordRecovery
    ? `${origin}/forgot-password?mode=reset`
    : (next ? `${origin}${next}` : `${origin}/login?verified=true`);

  // Create the redirect response FIRST so all session cookies set by Supabase SSR
  // are attached directly onto this response and sent to the browser!
  const response = NextResponse.redirect(redirectTarget);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  let success = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      success = true;
    }
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (!error) {
      success = true;
    }
  }

  if (success) {
    if (isPasswordRecovery) {
      // The recovery session cookies are now guaranteed on the response!
      return response;
    }
    // Signup email verification: sign out and send to login
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?verified=true`);
  }

  // Failed exchange or direct access without tokens
  if (isPasswordRecovery) {
    return NextResponse.redirect(`${origin}/forgot-password?error=recovery_failed`);
  }

  return NextResponse.redirect(`${origin}/login?verified=true`);
}

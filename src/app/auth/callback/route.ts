import { createServerClient } from '@supabase/ssr';
import { type EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');
  const roleParam = searchParams.get('role');

  const isPasswordRecovery = type === 'recovery' || (Boolean(next) && next!.includes('forgot-password'));
  const isEmailVerification = type === 'signup' || type === 'email' || (Boolean(next) && next!.includes('verified=true'));

  const redirectTarget = isPasswordRecovery
    ? `${origin}/forgot-password?mode=reset`
    : (next ? `${origin}${next}` : `${origin}/discovery`);

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
    } else {
      console.error('exchangeCodeForSession error in auth callback:', error);
    }
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (!error) {
      success = true;
    } else {
      console.error('verifyOtp error in auth callback:', error);
    }
  }

  if (success) {
    if (isPasswordRecovery) {
      // The recovery session cookies are now guaranteed on the response!
      return response;
    }

    if (isEmailVerification) {
      // Explicit signup email verification: sign out and send to login
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?verified=true`);
    }

    // --- OAuth Sign-In / Sign-Up Session Handling ---
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Check if user has an existing profile in the database
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      let userRole = existingProfile?.role;

      if (!existingProfile) {
        // Auto-provision profile for first-time OAuth login
        const chosenRole = roleParam === 'Creator' ? 'Creator' : (user.user_metadata?.role || 'User');
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'New Member';
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

        const { data: newProfile, error: profileInsertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: fullName,
            role: chosenRole,
            profile_pic_url: avatarUrl,
          })
          .select('role')
          .maybeSingle();

        if (profileInsertError && profileInsertError.code !== '23505') {
          console.warn('Profile creation during OAuth callback fallback:', profileInsertError);
        }

        userRole = newProfile?.role || chosenRole;
      }

      // Determine proper landing page based on user role
      let destination = next;
      if (!destination || destination.includes('/login') || destination.includes('/signup')) {
        if (userRole === 'Admin') {
          destination = '/admin';
        } else if (userRole === 'Creator') {
          destination = '/portfolio';
        } else {
          destination = '/discovery';
        }
      }

      const finalTarget = `${origin}${destination}`;
      const finalResponse = NextResponse.redirect(finalTarget);
      response.cookies.getAll().forEach((cookie) => {
        finalResponse.cookies.set(cookie);
      });
      return finalResponse;
    }

    return response;
  }

  // Failed exchange or direct access without tokens
  if (isPasswordRecovery) {
    return NextResponse.redirect(`${origin}/forgot-password?mode=reset`);
  }

  const oauthError = searchParams.get('error_description') || searchParams.get('error');
  if (oauthError) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(oauthError)}`);
  }

  return NextResponse.redirect(`${origin}/login`);
}

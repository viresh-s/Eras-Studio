import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const isAdminLoginRoute = pathname === '/admin/login';
  const isAdminRoute = pathname.startsWith('/admin');
  const hasAdminCookie = Boolean(request.cookies.get('erasstudio_admin_session')?.value);

  // If already logged into admin and accessing admin login page, redirect to overview
  if (isAdminLoginRoute && hasAdminCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/overview';
    return NextResponse.redirect(url);
  }

  // Fast-path: Check if any Supabase auth token cookie exists
  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token')
  );

  const isProtectedRoute =
    pathname.startsWith('/artwork') ||
    pathname.startsWith('/portfolio') ||
    pathname.startsWith('/discovery') ||
    pathname.startsWith('/cor') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/subscription') ||
    pathname.startsWith('/purchases') ||
    pathname.startsWith('/user');

  // If visiting a protected route without any auth token cookie, redirect to login immediately
  if (isProtectedRoute && !hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const isAuthOrLandingRoute =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/';

  // If public/landing/auth route and no auth cookie, proceed without Supabase network call
  if (!hasAuthCookie && (isAuthOrLandingRoute || !isAdminRoute)) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Handle protected admin routes
  if (isAdminRoute && !isAdminLoginRoute) {
    if (!hasAdminCookie) {
      let isSupabaseAdmin = false;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.role === 'Admin') {
          isSupabaseAdmin = true;
        }
      }

      if (!isSupabaseAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        const response = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          response.cookies.set(cookie.name, cookie.value);
        });
        return response;
      }
    }
  }

  // Handle standard protected user/creator routes
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });
    return response;
  }

  // Redirect logged-in users away from auth pages and the landing page
  if (isAuthOrLandingRoute && user) {
    if (pathname === '/login' && request.nextUrl.searchParams.get('verified') === 'true') {
      return supabaseResponse;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      return supabaseResponse;
    }

    const url = request.nextUrl.clone();
    if (profile.role === 'Admin') {
      url.pathname = '/admin/overview';
    } else {
      url.pathname = '/discovery';
    }
    const response = NextResponse.redirect(url);

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });

    return response;
  }

  return supabaseResponse;
}

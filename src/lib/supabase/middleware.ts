import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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

  const isAdminLoginRoute = request.nextUrl.pathname === '/admin/login';
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const hasAdminCookie = Boolean(request.cookies.get('erasstudio_admin_session')?.value);

  // If already logged into admin and accessing admin login page, redirect to overview
  if (isAdminLoginRoute && hasAdminCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/overview';
    return NextResponse.redirect(url);
  }

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

  // Other protected routes: artworks, discovery, portfolio, messages, settings, cor, subscription
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/artwork') ||
    request.nextUrl.pathname.startsWith('/portfolio') ||
    request.nextUrl.pathname.startsWith('/discovery') ||
    request.nextUrl.pathname.startsWith('/cor') ||
    request.nextUrl.pathname.startsWith('/messages') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname.startsWith('/subscription');

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
  const isAuthOrLandingRoute =
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup' ||
    request.nextUrl.pathname === '/';

  if (isAuthOrLandingRoute && user) {
    if (request.nextUrl.pathname === '/login' && request.nextUrl.searchParams.get('verified') === 'true') {
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

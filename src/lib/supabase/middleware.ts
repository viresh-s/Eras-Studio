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

  // Protected routes: artworks, discovery, portfolio, admin, messages, settings
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/artwork') ||
    request.nextUrl.pathname.startsWith('/portfolio') ||
    request.nextUrl.pathname.startsWith('/discovery') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/messages') ||
    request.nextUrl.pathname.startsWith('/settings');

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
  const isAuthOrLandingRoute = request.nextUrl.pathname === '/login' || 
                               request.nextUrl.pathname === '/signup' || 
                               request.nextUrl.pathname === '/';
                               
  if (isAuthOrLandingRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // If they have no profile, we shouldn't redirect them to a dashboard because 
    // the dashboard will just bounce them back. Let the auth page render (or sign them out).
    if (!profile) {
      return supabaseResponse;
    }

    const url = request.nextUrl.clone();
    if (profile.role === 'Admin') {
      url.pathname = '/admin';
    } else {
      // Direct both Creators and Users/Collectors to the discovery page
      url.pathname = '/discovery';
    }
    const response = NextResponse.redirect(url);
    
    // Copy cookies from supabaseResponse to ensure session isn't lost
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });
    
    return response;
  }

  return supabaseResponse;
}

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
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

  // 🚨 Strictly validate the token and trigger auto-refresh on the server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentPath = request.nextUrl.pathname;

  // Unauthenticated entry routes
  const isLandingRoute = currentPath === '/';
  const isAuthRoute = currentPath.startsWith('/login');

  // Protected gamified routes
  const isProtectedRoute =
    currentPath.startsWith('/dashboard') ||
    currentPath.startsWith('/customize') ||
    currentPath.startsWith('/shop') ||
    currentPath.startsWith('/compete') ||
    currentPath.startsWith('/leaderboard') ||
    currentPath.startsWith('/notifications');

  // 1. If NOT logged in and trying to access a protected route, bounce to /login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    return redirectResponse;
  }

  // 2. If LOGGED IN and hitting '/' or '/login', redirect at the Edge BEFORE app/page.tsx renders
  if (user && (isLandingRoute || isAuthRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(url);

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Apply to all routes EXCEPT static files, images, and Stripe webhook endpoints
    '/((?!_next/static|_next/image|favicon.ico|icon.png|robots.txt|sitemap.xml|api/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
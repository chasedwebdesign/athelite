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

  // 🚨 This call strictly validates the token and triggers the auto-refresh mechanism on the server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🛡️ Edge Route Protection: Stop infinite client-side redirect loops here
  const currentPath = request.nextUrl.pathname;
  
  // Define our unauthenticated route
  const isAuthRoute = currentPath.startsWith('/login');
  
  // Define our protected gamified routes
  const isProtectedRoute = 
    currentPath.startsWith('/dashboard') || 
    currentPath.startsWith('/customize') || 
    currentPath.startsWith('/shop') || 
    currentPath.startsWith('/compete') ||
    currentPath.startsWith('/leaderboard');

  // If they are NOT logged in and trying to access a secure app area, bounce to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    
    // 🔥 CRITICAL FIX: Transfer the refreshed Supabase cookies over to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    
    return redirectResponse;
  }

  // If they ARE logged in and trying to access the login page, push them to the hub
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(url);
    
    // 🔥 CRITICAL FIX: Transfer the refreshed Supabase cookies over to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Apply to all routes EXCEPT static files, images, API routes, and webhook endpoints
    '/((?!_next/static|_next/image|favicon.ico|api/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
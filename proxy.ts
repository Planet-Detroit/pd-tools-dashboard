import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { AUTH_COOKIE_DOMAIN, AUTH_COOKIE_MAX_AGE } from 'pd-auth';

// Protect all routes except /login and /auth/callback
// Unauthenticated users are redirected to /login
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            // Set on request so server components can read it
            request.cookies.set(name, value);
            // Set on response so browser stores it with cross-subdomain scope
            response.cookies.set(name, value, {
              ...options,
              domain: AUTH_COOKIE_DOMAIN,
              maxAge: AUTH_COOKIE_MAX_AGE,
              sameSite: 'lax',
              secure: true,
              httpOnly: true,
              path: '/',
            });
          }
        },
      },
    }
  );

  // Refresh the session — this updates the auth cookie if needed
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// Only run on routes that need protection (not login, not auth callback, not static assets)
export const config = {
  matcher: [
    // Match all paths except: /login, /auth/*, _next/static, _next/image, favicon.ico
    '/((?!login|auth|_next/static|_next/image|favicon\\.ico).*)',
  ],
};

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function isLocalDev(request: NextRequest): boolean {
  return request.nextUrl.hostname === 'localhost';
}

// Proxy only refreshes the Supabase session cookie — it does NOT redirect.
// Auth protection is handled client-side by the Dashboard component.
// This avoids cookie/domain mismatch issues during development.
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });
  const local = isLocalDev(request);

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
            request.cookies.set(name, value);
            response.cookies.set(name, value, {
              ...options,
              ...(local
              ? { secure: false, path: '/' }
              : { domain: '.tools.planetdetroit.org', sameSite: 'lax' as const, secure: true, path: '/' }),
            });
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Self-healing: if the session is broken, clear all auth cookies server-side.
  // JavaScript (document.cookie) can't clear httpOnly cookies — only the server can.
  // Without this, stale cookies accumulate and cause login loops.
  if (!user) {
    const cookieOpts = local
      ? { secure: false, path: '/' as const }
      : { domain: '.tools.planetdetroit.org', sameSite: 'lax' as const, secure: true, path: '/' as const };
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.set(cookie.name, '', { ...cookieOpts, maxAge: 0 });
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};

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
              : { domain: '.tools.planetdetroit.org', sameSite: 'lax' as const, secure: true, httpOnly: true, path: '/' }),
            });
          }
        },
      },
    }
  );

  // Just refresh the session — updates the cookie if the token was refreshed
  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};

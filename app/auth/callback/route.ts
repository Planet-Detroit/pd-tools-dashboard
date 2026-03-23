import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { AUTH_COOKIE_DOMAIN, AUTH_COOKIE_MAX_AGE } from 'pd-auth';

// Handle the magic link callback from Supabase
// Supabase sends the user here with a code in the URL
// We exchange the code for a session and set cookies
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const response = NextResponse.redirect(new URL(next, origin));

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

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
  }

  // If code exchange failed or no code, redirect to login with error
  return NextResponse.redirect(new URL('/login?error=link-expired', origin));
}

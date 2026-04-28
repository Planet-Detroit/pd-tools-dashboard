import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  const isExternal =
    next.startsWith('https://') && next.includes('.tools.planetdetroit.org');
  const destination = isExternal ? next : new URL('/', request.url).toString();

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  const response = NextResponse.redirect(destination);

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
              domain: '.tools.planetdetroit.org',
              sameSite: 'lax' as const,
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

  if (error) {
    return NextResponse.redirect(new URL('/?error=expired', request.url));
  }

  return response;
}

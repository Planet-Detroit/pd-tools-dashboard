'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

function clearStaleSessionCookies() {
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    if (name.startsWith('sb-') && !name.includes('code-verifier')) {
      document.cookie = `${name}=; domain=.tools.planetdetroit.org; path=/; max-age=0`;
      document.cookie = `${name}=; path=/; max-age=0`;
    }
  });
}

function CallbackHandler() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    const next = searchParams.get('next') || '/';

    const isExternal = next.startsWith('https://') && next.includes('.tools.planetdetroit.org');
    const destination = isExternal ? next : '/';

    clearStaleSessionCookies();

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        isSingleton: false,
        cookieOptions: {
          domain: '.tools.planetdetroit.org',
          sameSite: 'lax',
          secure: true,
        },
      }
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'SIGNED_IN' && session) {
        window.location.replace(destination);
      }
      if (event === 'INITIAL_SESSION' && !session) {
        setError('Login link expired or already used. Please request a new one.');
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F0F0' }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: '#DC2626' }}>{error}</p>
          <a href="/" className="text-sm underline" style={{ color: '#2982C4' }}>
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F0F0' }}>
      <p style={{ color: '#666' }}>Signing you in...</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F0F0' }}><p style={{ color: '#666' }}>Loading...</p></div>}>
      <CallbackHandler />
    </Suspense>
  );
}

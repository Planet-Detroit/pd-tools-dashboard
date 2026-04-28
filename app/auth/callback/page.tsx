'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabase } from '@/app/lib/supabase-browser';

function CallbackHandler() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabase();
    const next = searchParams.get('next') || '/';
    const code = searchParams.get('code');

    const isExternal = next.startsWith('https://') && next.includes('.tools.planetdetroit.org');
    const destination = isExternal ? next : '/';

    async function handleCallback() {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeError) {
          setError('Login link expired or already used. Please request a new one.');
          return;
        }
        window.location.replace(destination);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        window.location.replace(destination);
      } else {
        setError('No login code found. Please request a new magic link.');
      }
    }

    handleCallback();
    return () => { cancelled = true; };
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

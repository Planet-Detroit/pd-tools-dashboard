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

    const isExternal = next.startsWith('https://') && next.includes('.tools.planetdetroit.org');
    const destination = isExternal ? next : '/';

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'SIGNED_IN' && session) {
        window.location.replace(destination);
      }
    });

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setError('Login link may have expired. Please request a new one.');
      }
    }, 10000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
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

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabase } from '@/app/lib/supabase-browser';

function CallbackHandler() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = getSupabase();
    const next = searchParams.get('next') || '/';

    const isExternal = next.startsWith('https://') && next.includes('.tools.planetdetroit.org');
    const destination = isExternal ? next : '/';

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        window.location.replace(destination);
      }
    });

    supabase.auth.getSession().then(({ data: { session }, error: err }) => {
      if (session) {
        window.location.replace(destination);
      } else if (err) {
        setError('Login failed. Please try again.');
      }
    });
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F0F0' }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: '#DC2626' }}>{error}</p>
          <a href="/login" className="text-sm underline" style={{ color: '#2982C4' }}>
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

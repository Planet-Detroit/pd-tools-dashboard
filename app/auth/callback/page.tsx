'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/app/lib/supabase-browser';

// Handle the magic link callback
// createBrowserClient auto-detects the code in the URL and exchanges it
// We just need to wait for the session to be established, then redirect
export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();

    // Listen for sign-in event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        window.location.replace('/');
      }
    });

    // Check if session already exists
    supabase.auth.getSession().then(({ data: { session }, error: err }) => {
      if (session) {
        window.location.replace('/');
      } else if (err) {
        setError('Login failed. Please try again.');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

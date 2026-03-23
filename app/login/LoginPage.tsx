'use client';

import React, { useState, FormEvent } from 'react';
import { getSupabase } from '@/app/lib/supabase-browser';
import { sendMagicLink } from 'pd-auth';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('sending');
    setErrorMsg('');

    const redirectTo = `${window.location.origin}/auth/callback`;
    const result = await sendMagicLink(getSupabase(), email.trim(), redirectTo);

    if (result.error) {
      setStatus('error');
      setErrorMsg(result.error);
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F0F0F0' }}>
      {/* Header */}
      <header style={{ background: '#333333' }}>
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center gap-4">
          <img
            src="https://planetdetroit.org/wp-content/uploads/2024/07/cropped-PlanetDetroitLogo-WhiteText-2.png"
            alt="Planet Detroit"
            className="h-8"
          />
          <div>
            <h1 className="text-white text-lg font-bold tracking-tight">Editorial Tools</h1>
            <p className="text-sm" style={{ color: '#999' }}>Internal tools for the Planet Detroit team</p>
          </div>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="rounded-xl p-8" style={{ background: '#FFFFFF', border: '1px solid #CCCCCC' }}>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#111111' }}>Sign in</h2>
            <p className="text-sm mb-6" style={{ color: '#666' }}>
              Enter your email to receive a magic link.
            </p>

            {status === 'sent' ? (
              <div className="text-center py-4">
                <p className="text-base font-medium" style={{ color: '#2982C4' }}>
                  Check your email
                </p>
                <p className="text-sm mt-2" style={{ color: '#666' }}>
                  We sent a sign-in link to <strong>{email}</strong>. Click it to log in.
                </p>
                <button
                  onClick={() => { setStatus('idle'); setEmail(''); }}
                  className="mt-4 text-sm underline"
                  style={{ color: '#2982C4' }}
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: '#333' }}>
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@planetdetroit.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm mb-3"
                  style={{ border: '1px solid #CCCCCC', color: '#111' }}
                />

                {status === 'error' && (
                  <p className="text-sm mb-3" style={{ color: '#DC2626' }}>
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full py-2 rounded-lg text-white text-sm font-medium transition-colors"
                  style={{
                    background: status === 'sending' ? '#999' : '#2982C4',
                    cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {status === 'sending' ? 'Sending...' : 'Send magic link'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs" style={{ color: '#999' }}>
        <a href="https://planetdetroit.org" style={{ color: '#2982C4' }} className="hover:underline">planetdetroit.org</a>
      </footer>
    </div>
  );
}

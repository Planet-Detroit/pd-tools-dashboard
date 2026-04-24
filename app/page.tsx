'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/app/lib/supabase-browser';
import type { Session } from '@supabase/supabase-js';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F0F0' }}>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  return <DashboardView email={session.user.email ?? ''} />;
}

// ---- Login View ----
function LoginView() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('sending');
    const supabase = getSupabase();
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || '/';
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus('error');
      if (error.message?.includes('Signups not allowed') || error.message?.includes('not allowed')) {
        setErrorMsg('Email not recognized. Contact your editor for access.');
      } else {
        setErrorMsg(error.message);
      }
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F0F0F0' }}>
      <Header />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="rounded-xl p-8" style={{ background: '#FFFFFF', border: '1px solid #CCCCCC' }}>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#111111' }}>Sign in</h2>
            <p className="text-sm mb-6" style={{ color: '#666' }}>Enter your email to receive a magic link.</p>

            {status === 'sent' ? (
              <div className="text-center py-4">
                <p className="text-base font-medium" style={{ color: '#2982C4' }}>Check your email</p>
                <p className="text-sm mt-2" style={{ color: '#666' }}>
                  We sent a sign-in link to <strong>{email}</strong>. Click it to log in.
                </p>
                <button onClick={() => { setStatus('idle'); setEmail(''); }} className="mt-4 text-sm underline" style={{ color: '#2982C4' }}>
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: '#333' }}>Email address</label>
                <input id="email" type="email" placeholder="you@planetdetroit.org" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 rounded-lg text-sm mb-3" style={{ border: '1px solid #CCCCCC', color: '#111' }} />
                {status === 'error' && <p className="text-sm mb-3" style={{ color: '#DC2626' }}>{errorMsg}</p>}
                <button type="submit" disabled={status === 'sending'} className="w-full py-2 rounded-lg text-white text-sm font-medium" style={{ background: status === 'sending' ? '#999' : '#2982C4', cursor: status === 'sending' ? 'not-allowed' : 'pointer' }}>
                  {status === 'sending' ? 'Sending...' : 'Send magic link'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ---- Dashboard View ----
const tools = [
  { name: 'News Brief Generator', description: 'Turn article URLs into formatted "What we\'re reading" news briefs for the newsletter and website.', href: 'https://brief.tools.planetdetroit.org/', icon: 'N', color: '#2982C4' },
  { name: 'Newsletter Builder', description: 'Build the weekly email newsletter with editor\'s letter, stories, events, jobs, and environmental data.', href: 'https://newsletter.tools.planetdetroit.org/', icon: 'NL', color: '#2982C4' },
  { name: 'Civic Action Builder', description: 'Analyze articles to generate civic action blocks with meetings, organizations, and elected officials.', href: 'https://civic.tools.planetdetroit.org/', icon: 'CA', color: '#EA5A39' },
  { name: 'Events Manager', description: 'Create and manage events, registrations, confirmations, and event-specific social posts.', href: 'https://events.tools.planetdetroit.org/admin', icon: 'EV', color: '#EA5A39' },
  { name: 'Social Publisher', description: 'Generate and publish social media posts for any article across Bluesky, X, Facebook, Instagram, and LinkedIn.', href: 'https://social.tools.planetdetroit.org/', icon: 'SP', color: '#333333' },
  { name: 'Metrics Dashboard', description: 'View website traffic, engagement metrics, and content performance data.', href: 'https://dashboard.tools.planetdetroit.org/', icon: 'MD', color: '#515151' },
];

function DashboardView({ email }: { email: string }) {
  const [displayName, setDisplayName] = useState(email);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('user_roles').select('display_name').eq('user_id', session.user.id).single()
          .then(({ data }) => { if (data?.display_name) setDisplayName(data.display_name); });
      }
    });
  }, []);

  async function handleSignOut() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <div className="min-h-screen" style={{ background: '#F0F0F0' }}>
      <header style={{ background: '#333333' }}>
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="https://planetdetroit.org/wp-content/uploads/2024/07/cropped-PlanetDetroitLogo-WhiteText-2.png" alt="Planet Detroit" className="h-8" />
            <div>
              <h1 className="text-white text-lg font-bold tracking-tight">Editorial Tools</h1>
              <p className="text-sm" style={{ color: '#999' }}>Internal tools for the Planet Detroit team</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white">{displayName}</span>
            <button onClick={handleSignOut} className="text-xs px-3 py-1 rounded-md" style={{ color: '#CCC', border: '1px solid #555' }}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => (
            <a key={tool.name} href={tool.href} className="group block rounded-xl overflow-hidden transition-all hover:shadow-lg" style={{ background: '#FFFFFF', border: '1px solid #CCCCCC' }}>
              <div className="h-1.5" style={{ background: tool.color }} />
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ background: tool.color }}>{tool.icon}</div>
                  <h2 className="text-base font-bold group-hover:underline" style={{ color: '#111111' }}>{tool.name}</h2>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#515151', fontFamily: "Georgia, garamond, 'Times New Roman', serif" }}>{tool.description}</p>
              </div>
            </a>
          ))}
        </div>
      </main>
      <footer className="mt-auto py-6 text-center text-xs" style={{ color: '#999' }}>
        <a href="https://planetdetroit.org" style={{ color: '#2982C4' }} className="hover:underline">planetdetroit.org</a>
        {' '}&middot;{' '}
        <a href="https://donorbox.org/be-a-planet-detroiter-780440" style={{ color: '#2982C4' }} className="hover:underline">Support Planet Detroit</a>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header style={{ background: '#333333' }}>
      <div className="max-w-5xl mx-auto px-6 py-6 flex items-center gap-4">
        <img src="https://planetdetroit.org/wp-content/uploads/2024/07/cropped-PlanetDetroitLogo-WhiteText-2.png" alt="Planet Detroit" className="h-8" />
        <div>
          <h1 className="text-white text-lg font-bold tracking-tight">Editorial Tools</h1>
          <p className="text-sm" style={{ color: '#999' }}>Internal tools for the Planet Detroit team</p>
        </div>
      </div>
    </header>
  );
}


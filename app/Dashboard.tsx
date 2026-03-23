'use client';

import React from 'react';
import { AuthProvider, useAuth } from 'pd-auth/react';
import { getSupabase } from '@/app/lib/supabase-browser';

const tools = [
  {
    name: 'News Brief Generator',
    description: 'Turn article URLs into formatted "What we\'re reading" news briefs for the newsletter and website.',
    href: 'https://brief.tools.planetdetroit.org/',
    icon: 'N',
    color: '#2982C4',
  },
  {
    name: 'Newsletter Builder',
    description: 'Build the weekly email newsletter with editor\'s letter, stories, events, jobs, and environmental data.',
    href: 'https://newsletter.tools.planetdetroit.org/',
    icon: 'NL',
    color: '#2982C4',
  },
  {
    name: 'Civic Action Builder',
    description: 'Analyze articles to generate civic action blocks with meetings, organizations, and elected officials.',
    href: 'https://civic.tools.planetdetroit.org/',
    icon: 'CA',
    color: '#EA5A39',
  },
  {
    name: 'Events Manager',
    description: 'Create and manage events, registrations, confirmations, and event-specific social posts.',
    href: 'https://events.tools.planetdetroit.org/admin',
    icon: 'EV',
    color: '#EA5A39',
  },
  {
    name: 'Social Publisher',
    description: 'Generate and publish social media posts for any article across Bluesky, X, Facebook, Instagram, and LinkedIn.',
    href: 'https://social.tools.planetdetroit.org/',
    icon: 'SP',
    color: '#333333',
  },
  {
    name: 'Analytics Dashboard',
    description: 'View website traffic, engagement metrics, and content performance data.',
    href: 'https://dashboard.tools.planetdetroit.org/',
    icon: 'AD',
    color: '#515151',
  },
];

function DashboardContent() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F0F0' }}>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    );
  }

  // If not authenticated, middleware should have redirected.
  // But as a fallback, redirect client-side.
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: '#F0F0F0' }}>
      {/* Header with user info */}
      <header style={{ background: '#333333' }}>
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
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

          <div className="flex items-center gap-4">
            <span className="text-sm text-white">{user.displayName}</span>
            <button
              onClick={signOut}
              className="text-xs px-3 py-1 rounded-md transition-colors"
              style={{ color: '#CCC', border: '1px solid #555' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Tool Cards */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => (
            <a
              key={tool.name}
              href={tool.href}
              className="group block rounded-xl overflow-hidden transition-all hover:shadow-lg"
              style={{ background: '#FFFFFF', border: '1px solid #CCCCCC' }}
            >
              <div className="h-1.5" style={{ background: tool.color }} />
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ background: tool.color }}
                  >
                    {tool.icon}
                  </div>
                  <h2 className="text-base font-bold group-hover:underline" style={{ color: '#111111' }}>
                    {tool.name}
                  </h2>
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#515151', fontFamily: "Georgia, garamond, 'Times New Roman', serif" }}
                >
                  {tool.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-xs" style={{ color: '#999' }}>
        <a href="https://planetdetroit.org" style={{ color: '#2982C4' }} className="hover:underline">planetdetroit.org</a>
        {' '}&middot;{' '}
        <a href="https://donorbox.org/be-a-planet-detroiter-780440" style={{ color: '#2982C4' }} className="hover:underline">Support Planet Detroit</a>
      </footer>
    </div>
  );
}

export function Dashboard() {
  return (
    <AuthProvider supabaseClient={getSupabase()}>
      <DashboardContent />
    </AuthProvider>
  );
}

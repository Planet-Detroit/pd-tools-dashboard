import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ============================================================
// Dashboard Protection Tests
// Acceptance criteria:
// - After login, see tool cards with user name + sign out
// - User's name shown in header with sign-out option
// ============================================================

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn().mockReturnValue({
  data: { subscription: { unsubscribe: vi.fn() } },
});
const mockFrom = vi.fn();

vi.mock('@/app/lib/supabase-browser', () => ({
  getSupabase: () => ({
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

describe('Dashboard — authenticated view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows tool cards and user name when authenticated', async () => {
    // Acceptance: after login, see tool cards + user name in header
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'dustin-uuid', email: 'dustin@planetdetroit.org' },
        },
      },
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { email: 'dustin@planetdetroit.org', display_name: 'Dustin', role: 'editor' },
            error: null,
          }),
        }),
      }),
    });

    const { Dashboard } = await import('@/app/Dashboard');
    render(<Dashboard />);

    // Should show tool cards
    expect(await screen.findByText('Newsletter Builder')).toBeInTheDocument();
    expect(screen.getByText('Civic Action Builder')).toBeInTheDocument();
    expect(screen.getByText('News Brief Generator')).toBeInTheDocument();

    // Should show user name and sign out
    expect(screen.getByText('Dustin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('shows loading state while checking auth', async () => {
    // Don't flash tool cards or login while checking session
    mockGetSession.mockReturnValue(new Promise(() => {})); // Never resolves

    const { Dashboard } = await import('@/app/Dashboard');
    render(<Dashboard />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

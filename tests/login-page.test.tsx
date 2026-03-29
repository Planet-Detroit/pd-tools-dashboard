import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ============================================================
// Login + Dashboard UI Tests
// Acceptance criteria:
// - Unauthenticated: shows email input and "Send magic link" button
// - Unregistered email shows "Email not recognized" error
// - Successful send shows "Check your email" message
// - Authenticated: shows tool cards + user name + sign out
// ============================================================

const mockSignInWithOtp = vi.fn();
const mockGetSession = vi.fn();
const mockSignOut = vi.fn().mockResolvedValue({});
const mockOnAuthStateChange = vi.fn().mockReturnValue({
  data: { subscription: { unsubscribe: vi.fn() } },
});
const mockFrom = vi.fn();

vi.mock('@/app/lib/supabase-browser', () => ({
  getSupabase: () => ({
    auth: {
      signInWithOtp: (...args: any[]) => mockSignInWithOtp(...args),
      getSession: () => mockGetSession(),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
      signOut: () => mockSignOut(),
    },
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

describe('Unauthenticated — Login view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('shows email input and send button when not logged in', async () => {
    const Home = (await import('@/app/page')).default;
    render(<Home />);

    expect(await screen.findByPlaceholderText(/planetdetroit\.org/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
  });

  it('shows success message after sending magic link', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });

    const Home = (await import('@/app/page')).default;
    render(<Home />);

    await screen.findByPlaceholderText(/planetdetroit\.org/i);
    fireEvent.change(screen.getByPlaceholderText(/planetdetroit\.org/i), {
      target: { value: 'dustin@planetdetroit.org' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('shows error for unregistered email', async () => {
    mockSignInWithOtp.mockResolvedValue({
      error: { message: 'Signups not allowed for otp' },
    });

    const Home = (await import('@/app/page')).default;
    render(<Home />);

    await screen.findByPlaceholderText(/planetdetroit\.org/i);
    fireEvent.change(screen.getByPlaceholderText(/planetdetroit\.org/i), {
      target: { value: 'stranger@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByText(/email not recognized/i)).toBeInTheDocument();
    });
  });
});

describe('Authenticated — Dashboard view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'dustin-uuid', email: 'dustin@planetdetroit.org' },
          access_token: 'fake-token',
        },
      },
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { display_name: 'Dustin' },
            error: null,
          }),
        }),
      }),
    });
  });

  it('shows tool cards when authenticated', async () => {
    const Home = (await import('@/app/page')).default;
    render(<Home />);

    expect(await screen.findByText('Newsletter Builder')).toBeInTheDocument();
    expect(screen.getByText('Civic Action Builder')).toBeInTheDocument();
    expect(screen.getByText('News Brief Generator')).toBeInTheDocument();
  });

  it('shows user name and sign out button', async () => {
    const Home = (await import('@/app/page')).default;
    render(<Home />);

    expect(await screen.findByText('Dustin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });
});

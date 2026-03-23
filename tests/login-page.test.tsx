import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ============================================================
// Login Page UI Tests
// Acceptance criteria:
// - Login page shows email input and "Send magic link" button
// - Unregistered email shows "Email not recognized" error
// - Successful send shows "Check your email" message
// ============================================================

// Mock the Supabase browser client
const mockSignInWithOtp = vi.fn();

vi.mock('@/app/lib/supabase-browser', () => ({
  getSupabase: () => ({
    auth: {
      signInWithOtp: (...args: any[]) => mockSignInWithOtp(...args),
    },
  }),
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input and send button', async () => {
    // Acceptance: login page shows "Enter your email" field
    const { LoginPage } = await import('@/app/login/LoginPage');
    render(<LoginPage />);

    expect(screen.getByPlaceholderText(/planetdetroit\.org/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
  });

  it('shows success message after sending magic link', async () => {
    // Acceptance: user enters email → clicks "Send magic link" → sees confirmation
    mockSignInWithOtp.mockResolvedValue({ error: null });

    const { LoginPage } = await import('@/app/login/LoginPage');
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/planetdetroit\.org/i), {
      target: { value: 'dustin@planetdetroit.org' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('shows error for unregistered email', async () => {
    // Acceptance: unregistered email → "Email not recognized. Contact your editor for access."
    mockSignInWithOtp.mockResolvedValue({
      error: { message: 'Signups not allowed for otp' },
    });

    const { LoginPage } = await import('@/app/login/LoginPage');
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/planetdetroit\.org/i), {
      target: { value: 'stranger@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByText(/email not recognized/i)).toBeInTheDocument();
    });
  });

  it('disables button while sending', async () => {
    // Prevent double-sends
    let resolveOtp: (v: any) => void;
    mockSignInWithOtp.mockReturnValue(new Promise((r) => { resolveOtp = r; }));

    const { LoginPage } = await import('@/app/login/LoginPage');
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/planetdetroit\.org/i), {
      target: { value: 'dustin@planetdetroit.org' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();

    // Clean up
    resolveOtp!({ error: null });
  });
});

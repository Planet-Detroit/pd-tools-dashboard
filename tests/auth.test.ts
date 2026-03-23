import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasMinRole } from 'pd-auth';
import type { UserRole } from 'pd-auth';

// ============================================================
// Phase 1 Acceptance Criteria Tests
// These test the auth library logic and role system.
// Integration tests for Supabase/magic links require a live
// Supabase instance and are in auth.integration.test.ts.
// ============================================================

describe('hasMinRole — role hierarchy checks', () => {
  // Acceptance: admin can access all tools and manage users
  it('admin has access to admin-level features', () => {
    expect(hasMinRole('admin', 'admin')).toBe(true);
    expect(hasMinRole('admin', 'editor')).toBe(true);
    expect(hasMinRole('admin', 'reporter')).toBe(true);
  });

  // Acceptance: editor can access all tools and view all drafts
  it('editor has access to editor-level features but not admin', () => {
    expect(hasMinRole('editor', 'editor')).toBe(true);
    expect(hasMinRole('editor', 'reporter')).toBe(true);
    expect(hasMinRole('editor', 'admin')).toBe(false);
  });

  // Acceptance: reporter can access all tools but only own drafts
  it('reporter has reporter-level access only', () => {
    expect(hasMinRole('reporter', 'reporter')).toBe(true);
    expect(hasMinRole('reporter', 'editor')).toBe(false);
    expect(hasMinRole('reporter', 'admin')).toBe(false);
  });
});

describe('sendMagicLink — email validation', () => {
  // Mock Supabase client
  const mockSignInWithOtp = vi.fn();
  const mockClient = {
    auth: { signInWithOtp: mockSignInWithOtp },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends magic link for valid email', async () => {
    // Acceptance: registered user enters email → receives magic link
    mockSignInWithOtp.mockResolvedValue({ error: null });

    const { sendMagicLink } = await import('pd-auth');
    const result = await sendMagicLink(mockClient, 'dustin@planetdetroit.org', 'https://tools.planetdetroit.org');

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'dustin@planetdetroit.org',
      options: { emailRedirectTo: 'https://tools.planetdetroit.org' },
    });
    expect(result.error).toBeNull();
  });

  it('shows user-friendly error for unregistered email', async () => {
    // Acceptance: unregistered email → "Email not recognized. Contact your editor for access."
    mockSignInWithOtp.mockResolvedValue({
      error: { message: 'Signups not allowed for otp' },
    });

    const { sendMagicLink } = await import('pd-auth');
    const result = await sendMagicLink(mockClient, 'stranger@example.com', 'https://tools.planetdetroit.org');

    expect(result.error).toBe('Email not recognized. Contact your editor for access.');
  });

  it('passes through other Supabase errors', async () => {
    mockSignInWithOtp.mockResolvedValue({
      error: { message: 'Rate limit exceeded' },
    });

    const { sendMagicLink } = await import('pd-auth');
    const result = await sendMagicLink(mockClient, 'dustin@planetdetroit.org', 'https://tools.planetdetroit.org');

    expect(result.error).toBe('Rate limit exceeded');
  });
});

describe('fetchUserRole — user lookup', () => {
  it('returns PdUser for valid user_id', async () => {
    // Acceptance: after magic link login, user info + role is available
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                email: 'dustin@planetdetroit.org',
                display_name: 'Dustin',
                role: 'editor',
              },
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    const { fetchUserRole } = await import('pd-auth');
    const user = await fetchUserRole(mockClient, 'user-uuid-123');

    expect(user).toEqual({
      id: 'user-uuid-123',
      email: 'dustin@planetdetroit.org',
      displayName: 'Dustin',
      role: 'editor',
    });
  });

  it('returns null for unknown user_id', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'No rows found' },
            }),
          }),
        }),
      }),
    } as any;

    const { fetchUserRole } = await import('pd-auth');
    const user = await fetchUserRole(mockClient, 'nonexistent-uuid');

    expect(user).toBeNull();
  });
});

describe('Auth cookie configuration', () => {
  it('uses correct cookie domain for cross-subdomain sharing', async () => {
    // Acceptance: logged in on dashboard → navigating to civic.tools.planetdetroit.org recognizes them
    const { AUTH_COOKIE_DOMAIN } = await import('pd-auth');
    expect(AUTH_COOKIE_DOMAIN).toBe('.tools.planetdetroit.org');
  });

  it('sets 30-day session for magic link users', async () => {
    // Acceptance: session duration 30 days for magic link users
    const { AUTH_COOKIE_MAX_AGE } = await import('pd-auth');
    expect(AUTH_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 30);
  });

  it('sets 7-day session for guest users', async () => {
    // Acceptance: session duration 7 days for guest users
    const { GUEST_COOKIE_MAX_AGE } = await import('pd-auth');
    expect(GUEST_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 7);
  });
});

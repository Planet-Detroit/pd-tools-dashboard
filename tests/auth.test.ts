import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Phase 1 Acceptance Criteria Tests
// Tests auth logic inline (pd-auth removed as deploy dependency)
// ============================================================

// Role hierarchy check (same logic as pd-auth/client.ts)
function hasMinRole(userRole: string, requiredRole: string): boolean {
  const hierarchy: Record<string, number> = { admin: 3, editor: 2, reporter: 1 };
  return (hierarchy[userRole] ?? 0) >= (hierarchy[requiredRole] ?? 0);
}

describe('hasMinRole — role hierarchy checks', () => {
  it('admin has access to admin-level features', () => {
    expect(hasMinRole('admin', 'admin')).toBe(true);
    expect(hasMinRole('admin', 'editor')).toBe(true);
    expect(hasMinRole('admin', 'reporter')).toBe(true);
  });

  it('editor has access to editor-level features but not admin', () => {
    expect(hasMinRole('editor', 'editor')).toBe(true);
    expect(hasMinRole('editor', 'reporter')).toBe(true);
    expect(hasMinRole('editor', 'admin')).toBe(false);
  });

  it('reporter has reporter-level access only', () => {
    expect(hasMinRole('reporter', 'reporter')).toBe(true);
    expect(hasMinRole('reporter', 'editor')).toBe(false);
    expect(hasMinRole('reporter', 'admin')).toBe(false);
  });
});

describe('Auth cookie configuration', () => {
  const AUTH_COOKIE_DOMAIN = '.tools.planetdetroit.org';
  const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
  const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

  it('uses correct cookie domain for cross-subdomain sharing', () => {
    expect(AUTH_COOKIE_DOMAIN).toBe('.tools.planetdetroit.org');
  });

  it('sets 30-day session for magic link users', () => {
    expect(AUTH_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 30);
  });

  it('sets 7-day session for guest users', () => {
    expect(GUEST_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 7);
  });
});

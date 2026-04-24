import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Use createBrowserClient from @supabase/ssr so sessions are stored in cookies
// (not localStorage). This way the server-side proxy middleware can read them.
// Cookie domain set to .tools.planetdetroit.org so all *.tools subdomains share the session.
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    _supabase = createBrowserClient(url, key, {
      cookieOptions: {
        domain: '.tools.planetdetroit.org',
        sameSite: 'lax',
        secure: true,
      },
    });
  }
  return _supabase;
}

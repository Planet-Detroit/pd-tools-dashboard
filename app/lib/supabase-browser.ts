import { createPdAuthClient } from 'pd-auth';
import type { SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — avoids crash during Next.js static build when env vars aren't set
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    _supabase = createPdAuthClient(url, key);
  }
  return _supabase;
}

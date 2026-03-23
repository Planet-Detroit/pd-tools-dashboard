import { cookies } from 'next/headers';
import { createPdServerClient } from 'pd-auth/server';

// Create a Supabase server client for use in server components and route handlers
// cookies() is async in Next.js 16
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createPdServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookieStore
  );
}

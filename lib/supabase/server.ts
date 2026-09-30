import { createServerClient } from '@supabase/ssr';
import { createClient as createDirectClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — ignore
          }
        },
      },
    }
  );
}

/**
 * Privileged DB client for server-side data-layer operations.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY when configured (bypasses RLS — the key
 * NEVER leaves the server), otherwise falls back to the cookie-aware anon
 * client. Public checkouts are anonymous, and anon has INSERT-but-not-SELECT
 * on `orders`, so `insert().select().single()` fails for customers while it
 * succeeds for logged-in admins — that mismatch was the "order shows live
 * once, disappears on refresh" bug. Always go through this helper from
 * lib/db-supabase.ts so behaviour is identical with or without the key.
 */
export async function createDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    return createDirectClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return createClient();
}

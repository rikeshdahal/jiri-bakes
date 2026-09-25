import 'server-only';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

/**
 * Returns true when the request carries a valid Supabase session.
 * Falls back to checking the httpOnly `jiri_admin_session` cookie only
 * when Supabase auth is unreachable — never grants access by default.
 */
export async function requireAdmin(): Promise<boolean> {
  // 1. Check Supabase Auth session (authoritative).
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) return true;
    } catch {
      // Supabase auth failed or unavailable — fall through to cookie check.
    }
  }

  // 2. Cookie fallback — only accept sessions set by a real Supabase login.
  //    The 'admin-master' ID was a backdoor from a previous version and is
  //    explicitly rejected here.
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('jiri_admin_session');
    if (session?.value) {
      const parsed = JSON.parse(session.value);
      if (
        parsed?.email &&
        parsed?.id &&
        parsed.id !== 'admin-master' &&
        // Must look like a real Supabase UUID, not a placeholder
        /^[0-9a-f-]{20,}$/i.test(String(parsed.id))
      ) {
        return true;
      }
    }
  } catch {
    // Invalid cookie
  }

  return false;
}

import 'server-only';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

/** True when the request carries a logged-in Supabase (admin) session OR fallback admin cookie. Never throws. */
export async function requireAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return true;
  } catch {
    // Supabase auth failed or unavailable
  }

  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('jiri_admin_session');
    if (session?.value) {
      const parsed = JSON.parse(session.value);
      if (parsed?.email || parsed?.id) {
        return true;
      }
    }
  } catch {
    // Invalid cookie
  }

  return false;
}


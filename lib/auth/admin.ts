import 'server-only';
import { createClient } from '@/lib/supabase/server';

/** True when the request carries a logged-in Supabase (admin) session. Never throws. */
export async function requireAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

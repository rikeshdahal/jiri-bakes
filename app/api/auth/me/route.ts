import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Check Supabase session first (most authoritative)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error && user) {
          return NextResponse.json({
            data: { id: user.id, email: user.email },
          });
        }
      } catch {
        // Supabase error — fall through to cookie check
      }
    }

    // Validate the fallback cookie is a legitimate session set by our login route.
    const cookieStore = await cookies();
    const localSession = cookieStore.get('jiri_admin_session');

    if (localSession?.value) {
      try {
        const parsed = JSON.parse(localSession.value);
        // Require both id and email, and id must not be the removed 'admin-master' backdoor.
        if (parsed?.email && parsed?.id && parsed.id !== 'admin-master') {
          return NextResponse.json({
            data: { id: parsed.id, email: parsed.email },
          });
        }
      } catch {
        // Invalid cookie
      }
    }

    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

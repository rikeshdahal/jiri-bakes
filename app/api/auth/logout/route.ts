import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('jiri_admin_session');

    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore Supabase signout errors
    }

    return NextResponse.json({ data: { success: true } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

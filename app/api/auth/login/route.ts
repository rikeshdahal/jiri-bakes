import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { slidingWindowRateLimit } from '@/lib/utils/rate-limit';

export async function POST(request: Request) {
  try {
    // Rate limit: 10 login attempts per 15 minutes per IP (brute-force protection).
    try {
      const h = await headers();
      const rawIp =
        h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
      const limit = slidingWindowRateLimit(`login:${rawIp.slice(0, 64)}`, 10, 15 * 60 * 1000);
      if (!limit.ok) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please wait and try again.' },
          { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds ?? 60) } },
        );
      }
    } catch {
      // headers() unavailable — skip rate limit
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email: rawEmail, password: rawPassword } = body as { email?: string; password?: string };

    // Trim and reject empty / placeholder-only submissions — no empty login.
    const email = rawEmail?.trim();
    const password = rawPassword?.trim();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Authenticate exclusively via Supabase Auth.
    // If Supabase is unavailable, we fail closed — no hardcoded fallback credentials.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Authentication service is not configured.' }, { status: 503 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      // Use a generic message to avoid user enumeration
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set('jiri_admin_session', JSON.stringify({ email: data.user.email, id: data.user.id }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      data: {
        user: { id: data.user.id, email: data.user.email },
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

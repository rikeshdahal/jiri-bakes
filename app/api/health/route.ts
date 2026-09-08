import { NextResponse } from 'next/server';
import { getBackend } from '@/lib/db';
import { getSmtpSettings } from '@/lib/email/config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health — deployment diagnostics (no secrets exposed).
 * Open this on production to verify every subsystem:
 *   https://jiri-bakes.vercel.app/api/health
 */
export async function GET() {
  const checks: Record<string, string | boolean | number> = {};

  // Database backend + reachability
  try {
    const backend = await getBackend();
    checks.backend = backend;
    if (backend === 'supabase') {
      const { getDbProducts } = await import('@/lib/db');
      const products = await getDbProducts();
      checks.supabase = true;
      checks.products = products.length;
    } else {
      checks.supabase = process.env.USE_SUPABASE_DB === 'true' ? 'fallback-to-file' : 'not-enabled';
      if (process.env.VERCEL) {
        checks.warning =
          'File backend on Vercel is read-only: orders will NOT persist. Set USE_SUPABASE_DB=true and run supabase/schema.sql.';
      }
    }
  } catch (e) {
    checks.backend = 'error';
    checks.error = e instanceof Error ? e.message : 'DB unreachable';
  }

  // Email
  const smtp = getSmtpSettings();
  checks.smtp = smtp ? true : 'not-configured (orders still save, emails skipped)';

  // Supabase auth (admin login)
  checks.auth =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Site URL used inside email links
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  checks.siteUrl = siteUrl ?? 'missing (email links will be wrong)';

  const ok = checks.backend === 'supabase' || checks.backend === 'file';
  return NextResponse.json({ ok, checks });
}

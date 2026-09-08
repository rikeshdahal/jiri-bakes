import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSmtpSettings } from '@/lib/email/config';
import { sendMail, resetTransporter } from '@/lib/email/mailer';

// GET /api/email/test — admin only. Verifies SMTP config + sends a test email.
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const settings = getSmtpSettings();
    if (!settings) {
      return NextResponse.json(
        { ok: false, error: 'SMTP is not configured. Set SMTP_USER / SMTP_PASS.' },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to')?.trim() || user.email || settings.fromEmail;

    resetTransporter();
    const res = await sendMail({
      to,
      subject: `SMTP test — ${settings.fromName}`,
      html: `<p>SMTP is working for <strong>${settings.fromName}</strong>.</p><p>Host: ${settings.host}:${settings.port} (secure=${settings.secure})</p>`,
      text: `SMTP is working for ${settings.fromName}. Host: ${settings.host}:${settings.port} (secure=${settings.secure})`,
    });

    if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
    return NextResponse.json({ ok: true, messageId: res.messageId, to });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

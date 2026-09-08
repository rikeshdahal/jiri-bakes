import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { inquirySchema, cleanText } from '@/lib/validations/order';
import { slidingWindowRateLimit } from '@/lib/utils/rate-limit';
import { getSmtpSettings } from '@/lib/email/config';
import { sendMail } from '@/lib/email/mailer';
import { inquiryAutoreplyEmail } from '@/lib/email/templates/inquiry-autoreply';
import { getDbSettings } from '@/lib/db';

// POST /api/contact — public inquiry form with auto-reply + staff alert.
export async function POST(request: Request) {
  try {
    let h: Awaited<ReturnType<typeof headers>> | null = null;
    try {
      h = await headers();
    } catch {
      h = null;
    }
    const rawIp =
      h?.get('x-forwarded-for')?.split(',')[0]?.trim() || h?.get('x-real-ip') || 'unknown';
    const limit = slidingWindowRateLimit(`contact:${rawIp.slice(0, 64)}`, 5);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many messages from this connection. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds ?? 60) } },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = inquirySchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first ? `${first.path.join('.')}: ${first.message}` : 'Please check the form and try again.' },
        { status: 400 },
      );
    }

    const name = cleanText(parsed.data.name, 120);
    const email = parsed.data.email.toLowerCase();
    const phone = cleanText(parsed.data.phone, 24);
    const message = cleanText(parsed.data.message, 3000);

    const settings = getSmtpSettings();
    if (!settings) {
      // Persist-less graceful path: accept the message, explain email is offline.
      console.warn('[contact] SMTP not configured — inquiry from', email, 'not emailed.');
      return NextResponse.json(
        { data: { ok: true }, mail: { customer: false, staff: false }, warning: 'Message received, but email service is not configured.' },
        { status: 201 },
      );
    }

    let siteName = settings.fromName;
    let supportEmail = settings.fromEmail;
    let supportPhone = '+977 1-4567890';
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://jiribakes.com.np';
    try {
      const s = await getDbSettings();
      const get = (k: string) => s.find((x) => x.key === k)?.value ?? '';
      siteName = get('site_name') || siteName;
      supportEmail = get('email') || supportEmail;
      supportPhone = get('phone') || supportPhone;
    } catch {
      // ignore — fallbacks above
    }

    const autoreply = inquiryAutoreplyEmail({
      siteName,
      siteUrl,
      supportEmail,
      supportPhone,
      name,
      message,
      phone,
    });
    const customer = await sendMail({ to: email, subject: autoreply.subject, html: autoreply.html, text: autoreply.text });

    const notifyTargets =
      settings.notifyTo.length > 0 ? settings.notifyTo : supportEmail ? [supportEmail] : [];
    let staff = false;
    if (notifyTargets.length > 0 && !notifyTargets.includes(email)) {
      const staffRes = await sendMail({
        to: notifyTargets,
        subject: `[New Inquiry] ${name} — ${email}`,
        html: `<p>New contact inquiry from <strong>${name}</strong> (${email} / ${phone}).</p><p style="white-space:pre-wrap;">${message}</p>`,
        text: `New contact inquiry from ${name} (${email} / ${phone}).\n\n${message}`,
        replyTo: email,
      });
      staff = staffRes.ok;
    }

    return NextResponse.json({ data: { ok: true }, mail: { customer: customer.ok, staff } }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

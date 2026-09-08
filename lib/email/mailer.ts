import 'server-only';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { lookup } from 'node:dns';
import { getSmtpSettings } from './config';

let transporter: Transporter | null = null;
let resolvedHostCache: { host: string; servername: string } | null = null;

/**
 * Nodemailer 9.x resolves the SMTP host itself and, on hosts that advertise
 * both A and AAAA records, prefers IPv6. On some Windows networks the IPv6
 * connect hangs for minutes. We resolve the hostname over IPv4 ourselves and
 * hand nodemailer a literal IP (with `servername` preserved for TLS SNI /
 * certificate verification), so the connection is both fast and correct.
 */
async function resolveSmtpHost(hostname: string): Promise<{ host: string; servername: string }> {
  if (resolvedHostCache && resolvedHostCache.servername === hostname) {
    return resolvedHostCache;
  }
  try {
    const address = await new Promise<string>((resolve, reject) => {
      lookup(hostname, { family: 4 }, (err, addr) => (err ? reject(err) : resolve(addr)));
    });
    resolvedHostCache = { host: address, servername: hostname };
    return resolvedHostCache;
  } catch {
    console.warn(`[mailer] IPv4 lookup failed for "${hostname}", using nodemailer's resolver.`);
    return { host: hostname, servername: hostname };
  }
}

async function getTransporter() {
  if (transporter) return transporter;
  const settings = getSmtpSettings();
  if (!settings) {
    throw new Error('SMTP is not configured. Check SMTP_* environment variables.');
  }
  const { host, servername } = await resolveSmtpHost(settings.host);
  transporter = nodemailer.createTransport({
    host,
    port: settings.port,
    secure: settings.secure,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    auth: {
      user: settings.user,
      pass: settings.pass,
    },
    tls: { servername },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  return transporter;
}

export interface SendMailInput {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SendMailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends a single email. Never throws — callers rely on the `ok` flag.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const settings = getSmtpSettings();
  if (!settings) {
    return { ok: false, error: 'SMTP is not configured.' };
  }

  try {
    const mailTransport = await getTransporter();
    const info = await mailTransport.sendMail({
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: Array.isArray(input.to) ? input.to.join(', ') : input.to,
      replyTo: input.replyTo ?? settings.fromEmail,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    return { ok: true, messageId: typeof info.messageId === 'string' ? info.messageId : undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown SMTP error';
    console.error('[mailer] failed to send email:', message);
    // Reset transporter so the next send retries with a fresh connection.
    transporter = null;
    return { ok: false, error: message };
  }
}

/** Force a fresh SMTP connection on the next send (used by the test endpoint). */
export function resetTransporter() {
  transporter = null;
  resolvedHostCache = null;
}

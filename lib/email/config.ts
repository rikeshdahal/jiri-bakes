import 'server-only';

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  /** Comma-separated list of admin addresses that receive order alerts. */
  notifyTo: string[];
}

/**
 * Some .env files put explanatory comments on the same line as the value
 * ("SMTP_PORT=465   # implicit TLS"). Next.js does not strip those inline
 * comments, so strip anything after the first unquoted "#".
 */
function env(name: string): string {
  const raw = process.env[name]?.trim() ?? '';
  return raw.split('#')[0].trim();
}

export function getSmtpSettings(): SmtpSettings | null {
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS');

  if (!user || !pass) return null;

  const port = Number(env('SMTP_PORT') || '465') || 465;
  const rawSecure = env('SMTP_SECURE').toLowerCase();
  // Port 465 is implicit TLS only. If the env says "false" but the port is
  // 465, force true to avoid a silent connection hang with Gmail.
  const secure = rawSecure === 'true' ? true : rawSecure === 'false' ? port !== 465 : port === 465;

  return {
    host: env('SMTP_HOST') || 'smtp.gmail.com',
    port,
    secure,
    user,
    pass,
    fromName: env('SMTP_FROM_NAME') || 'Jiri Bakes',
    fromEmail: env('SMTP_FROM_EMAIL') || user,
    notifyTo: (env('SMTP_NOTIFY_TO') ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && s.includes('@')),
  };
}

import 'server-only';

export interface InquiryAutoreplyData {
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  supportPhone: string;
  name: string;
  message: string;
  phone?: string;
}

const esc = (value: string | number | null | undefined): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function inquiryAutoreplyEmail(data: InquiryAutoreplyData): {
  subject: string;
  html: string;
  text: string;
} {
  const { siteName, siteUrl, supportEmail, supportPhone, name, message } = data;
  const subject = `Thanks for reaching out, ${name} — ${siteName} received your message`;

  const text = [
    `Dear ${name},`,
    ``,
    `Thank you for contacting ${siteName}. We've received your message and`,
    `our team will get back to you within one business day.`,
    ``,
    `Your message:`,
    message,
    ``,
    `Urgent? Call ${supportPhone} or reply to this email (${supportEmail}).`,
    ``,
    siteName,
    siteUrl,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background-color:#faf6ef;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf6ef;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:18px;border:1px solid #e8ddc9;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#28551c,#52b788);padding:28px 32px;">
<div style="color:#fff;font-size:20px;font-weight:800;">🍞 ${esc(siteName)}</div>
<div style="color:rgba(255,255,255,.85);font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;">We received your message</div>
</td></tr>
<tr><td style="padding:32px;">
<p style="color:#2b1d10;font-size:15px;margin:0 0 16px;">Dear <strong>${esc(name)}</strong>,</p>
<p style="color:#334155;font-size:13.5px;line-height:1.7;margin:0 0 20px;">Thanks for contacting ${esc(siteName)}. A team member will reply within one business day.</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin:0 0 24px;">
<span style="color:#8a7654;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:6px;">Your message</span>
<div style="color:#2b1d10;font-size:13px;line-height:1.65;white-space:pre-wrap;">${esc(message)}</div>
</div>
<p style="color:#2b1d10;font-size:13px;margin:0;">Urgent? Call ${esc(supportPhone)} or <a href="mailto:${esc(supportEmail)}" style="color:#28551c;font-weight:700;">${esc(supportEmail)}</a>.</p>
</td></tr>
<tr><td style="background:#faf6ef;border-top:1px solid #e8ddc9;padding:20px;text-align:center;color:#8a7654;font-size:11.5px;">&copy; ${new Date().getFullYear()} ${esc(siteName)} · <a href="${esc(siteUrl)}" style="color:#28551c;">${esc(siteUrl)}</a></td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  return { subject, html, text };
}

import 'server-only';

export type OrderStatusKey =
  | 'pending'
  | 'confirmed'
  | 'baking'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface OrderStatusData {
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  supportPhone: string;
  orderId: string;
  customerName: string;
  status: OrderStatusKey;
  total: number;
  currency: string;
}

const esc = (value: string | number | null | undefined): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const STATUS_COPY: Record<OrderStatusKey, { title: string; body: string; emoji: string }> = {
  pending: { title: 'Order Received', body: 'We have received your order and will confirm it shortly.', emoji: '🧾' },
  confirmed: { title: 'Order Confirmed', body: 'Your order is confirmed. Our bakers will start preparing it fresh.', emoji: '✅' },
  baking: { title: 'Being Baked', body: 'Good news — your treats are in the oven right now. Freshness incoming!', emoji: '🔥' },
  preparing: { title: 'Being Prepared', body: 'Your order is being packed with care for delivery / pickup.', emoji: '📦' },
  ready: { title: 'Ready for Pickup / Dispatch', body: 'Your order is ready! Come pick it up, or our rider is on the way.', emoji: '🔔' },
  delivered: { title: 'Delivered', body: 'Your order has been delivered. Enjoy every bite!', emoji: '🛵' },
  completed: { title: 'Completed — Thank You', body: 'Your order is complete. Thank you for choosing Jiri Bakes!', emoji: '★' },
  cancelled: { title: 'Order Cancelled', body: 'Your order has been cancelled. If this was a mistake, please call us and we will help.', emoji: '✕' },
};

export function orderStatusEmail(data: OrderStatusData): {
  subject: string;
  html: string;
  text: string;
} {
  const { siteName, siteUrl, supportEmail, supportPhone, orderId, customerName, status, total, currency } = data;
  const copy = STATUS_COPY[status] ?? STATUS_COPY.pending;

  const subject = `${copy.title}: ${orderId} — ${siteName}`;
  const trackUrl = `${siteUrl.replace(/\/$/, '')}/track?id=${encodeURIComponent(orderId)}`;
  const text = [
    `Dear ${customerName},`,
    ``,
    `${copy.emoji} ${copy.title} — order ${orderId}.`,
    copy.body,
    ``,
    `Total: ${currency} ${total.toLocaleString()}`,
    ``,
    `Track live: ${trackUrl}`,
    ``,
    `Questions? Call ${supportPhone} or reply to this email (${supportEmail}).`,
    ``,
    siteName,
    siteUrl,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background-color:#faf6ef;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf6ef;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;border:1px solid #e8ddc9;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#28551c,#52b788);padding:24px 28px;">
<div style="color:#fff;font-size:18px;font-weight:800;">${esc(copy.emoji)} ${esc(copy.title)}</div>
<div style="color:rgba(255,255,255,.85);font-size:12px;margin-top:4px;">Order ${esc(orderId)} · ${esc(siteName)}</div>
</td></tr>
<tr><td style="padding:28px;">
<p style="color:#2b1d10;font-size:14.5px;line-height:1.65;margin:0 0 14px;">Dear <strong>${esc(customerName)}</strong>,</p>
<p style="color:#2b1d10;font-size:13.5px;line-height:1.7;margin:0 0 16px;">${esc(copy.body)}</p>
<div style="background:#f4fbf3;border:1px solid #cde6d0;border-radius:12px;padding:12px 16px;font-size:13px;color:#28551c;">
Order total: <strong>${esc(currency)} ${esc(total.toLocaleString())}</strong>
</div>
<div style="text-align:center;margin:18px 0 4px;">
<a href="${esc(trackUrl)}" style="display:inline-block;background:#28551c;color:#ffffff;text-decoration:none;font-weight:800;font-size:13.5px;padding:12px 28px;border-radius:9999px;">Track Your Order Live →</a>
</div>
<p style="color:#2b1d10;font-size:12.5px;margin:16px 0 0;">Questions? Call ${esc(supportPhone)} or <a href="mailto:${esc(supportEmail)}" style="color:#28551c;font-weight:700;">${esc(supportEmail)}</a>.</p>
</td></tr>
<tr><td style="background:#faf6ef;border-top:1px solid #e8ddc9;padding:16px;text-align:center;color:#8a7654;font-size:11px;">&copy; ${new Date().getFullYear()} ${esc(siteName)} · <a href="${esc(siteUrl)}" style="color:#28551c;">${esc(siteUrl)}</a></td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  return { subject, html, text };
}

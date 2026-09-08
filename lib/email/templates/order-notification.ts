import 'server-only';

export interface OrderNotificationData {
  siteName: string;
  adminUrl: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  paymentMethod: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  currency: string;
  deliveryDate?: string;
  deliveryTime?: string;
  variant?: string;
  messageOnItem?: string;
  notes?: string;
}

const esc = (value: string | number | null | undefined): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function orderNotificationEmail(data: OrderNotificationData): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    siteName,
    adminUrl,
    orderId,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    paymentMethod,
    items,
    total,
    currency,
    deliveryDate,
    deliveryTime,
    variant,
    messageOnItem,
    notes,
  } = data;

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subject = `[New Order] ${orderId} — ${customerName} (${itemCount} items, ${currency} ${total.toLocaleString()})`;

  const text = [
    `A new bakery order has been received.`,
    ``,
    `Order ID: ${orderId}`,
    `Customer: ${customerName} — ${customerPhone}${customerEmail ? ` / ${customerEmail}` : ''}`,
    `Address: ${customerAddress}`,
    `Payment: ${paymentMethod}`,
    deliveryDate ? `Delivery slot: ${deliveryDate}${deliveryTime ? ` (${deliveryTime})` : ''}` : '',
    variant ? `Variant: ${variant}` : '',
    messageOnItem ? `Message on item: "${messageOnItem}"` : '',
    ``,
    `Items:`,
    ...items.map((i) => `• ${i.name} × ${i.quantity} — ${currency} ${(i.price * i.quantity).toLocaleString()}`),
    ``,
    `Total: ${currency} ${total.toLocaleString()}`,
    notes ? `Notes: ${notes}` : '',
    ``,
    `Manage in admin: ${adminUrl}`,
  ]
    .filter((line) => line !== '')
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${esc(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#101a0e;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#101a0e;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#16240f;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
            <tr>
              <td style="background:linear-gradient(135deg,#28551c,#52b788);padding:22px 26px;">
                <div style="color:#fff;font-size:16px;font-weight:800;">New Order — ${esc(siteName)}</div>
                <div style="color:rgba(255,255,255,0.9);font-size:12px;font-weight:600;margin-top:3px;">${esc(orderId)} · ${esc(paymentMethod)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:26px;color:#e5e7eb;font-size:13.5px;line-height:1.7;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="color:#9ca3af;padding:4px 0;">Customer</td><td style="text-align:right;font-weight:600;">${esc(customerName)}</td></tr>
                  <tr><td style="color:#9ca3af;padding:4px 0;">Phone</td><td style="text-align:right;font-weight:600;"><a href="tel:${esc(customerPhone)}" style="color:#52b788;">${esc(customerPhone)}</a></td></tr>
                  ${customerEmail ? `<tr><td style="color:#9ca3af;padding:4px 0;">Email</td><td style="text-align:right;font-weight:600;">${esc(customerEmail)}</td></tr>` : ''}
                  <tr><td style="color:#9ca3af;padding:4px 0;">Address</td><td style="text-align:right;font-weight:600;">${esc(customerAddress)}</td></tr>
                  ${deliveryDate ? `<tr><td style="color:#9ca3af;padding:4px 0;">Slot</td><td style="text-align:right;font-weight:600;">${esc(deliveryDate)}${deliveryTime ? ` · ${esc(deliveryTime)}` : ''}</td></tr>` : ''}
                  ${variant ? `<tr><td style="color:#9ca3af;padding:4px 0;">Variant</td><td style="text-align:right;font-weight:600;">${esc(variant)}</td></tr>` : ''}
                  <tr><td style="color:#9ca3af;padding:4px 0;">Total</td><td style="text-align:right;font-weight:800;color:#52b788;">${esc(currency)} ${esc(total.toLocaleString())}</td></tr>
                </table>
                <div style="border-top:1px solid rgba(255,255,255,0.12);margin:16px 0;"></div>
                <div style="color:#9ca3af;margin-bottom:6px;">Items (${esc(itemCount)})</div>
                ${items.map((i) => `<div style="display:flex;justify-content:space-between;padding:3px 0;"><span>${esc(i.name)} × ${esc(i.quantity)}</span><span style="font-weight:600;">${esc(currency)} ${esc((i.price * i.quantity).toLocaleString())}</span></div>`).join('')}
                ${messageOnItem ? `<div style="border-top:1px solid rgba(255,255,255,0.12);margin:16px 0;"></div><div style="color:#9ca3af;">Message on item</div><div style="margin-top:4px;font-style:italic;">&ldquo;${esc(messageOnItem)}&rdquo;</div>` : ''}
                ${notes ? `<div style="border-top:1px solid rgba(255,255,255,0.12);margin:16px 0;"></div><div style="color:#9ca3af;">Notes</div><div style="margin-top:4px;white-space:pre-wrap;">${esc(notes)}</div>` : ''}
                <a href="${esc(adminUrl)}" style="display:inline-block;margin-top:22px;background:#52b788;color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:11px 20px;border-radius:10px;">Open in Admin</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

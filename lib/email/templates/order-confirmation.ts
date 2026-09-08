import 'server-only';

export interface OrderConfirmationData {
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  supportPhone: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: string;
  items: { name: string; price: number; quantity: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  variant?: string;
  messageOnItem?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  notes?: string;
}

const esc = (value: string | number | null | undefined): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const money = (n: number, currency: string) =>
  `${currency} ${Number(n || 0).toLocaleString('en-US')}`;

const row = (label: string, value: string): string => `
  <tr>
    <td style="padding:7px 0;color:#8a7654;font-size:13px;width:42%;vertical-align:top;">${label}</td>
    <td style="padding:7px 0;color:#2b1d10;font-size:13.5px;font-weight:600;vertical-align:top;">${value}</td>
  </tr>`;

export function orderConfirmationEmail(data: OrderConfirmationData): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    siteName,
    siteUrl,
    supportEmail,
    supportPhone,
    orderId,
    customerName,
    customerPhone,
    customerAddress,
    paymentMethod,
    items,
    subtotal,
    deliveryFee,
    total,
    currency,
    variant,
    messageOnItem,
    deliveryDate,
    deliveryTime,
    notes,
  } = data;

  const subject = `Order Confirmed ${orderId} — ${siteName}`;
  const trackUrl = `${siteUrl.replace(/\/$/, '')}/track?id=${encodeURIComponent(orderId)}`;

  const itemLines = items
    .map((i) => `• ${i.name} × ${i.quantity} — ${money(i.price * i.quantity, currency)}`)
    .join('\n');

  const text = [
    `Dear ${customerName},`,
    ``,
    `Thank you for ordering from ${siteName}! Your order has been received and our bakers are on it.`,
    ``,
    `Order ID: ${orderId}`,
    `Payment: ${paymentMethod}`,
    deliveryDate ? `Delivery slot: ${deliveryDate}${deliveryTime ? ` (${deliveryTime})` : ''}` : '',
    variant ? `Variant: ${variant}` : '',
    messageOnItem ? `Message on item: "${messageOnItem}"` : '',
    ``,
    `Items:`,
    itemLines,
    ``,
    `Subtotal: ${money(subtotal, currency)}`,
    `Delivery: ${deliveryFee === 0 ? 'FREE' : money(deliveryFee, currency)}`,
    `Total${paymentMethod.toLowerCase().includes('cash') ? ' (pay on delivery)' : ''}: ${money(total, currency)}`,
    ``,
    `Deliver to: ${customerAddress}`,
    `Phone: ${customerPhone}`,
    notes ? `Your notes: ${notes}` : '',
    ``,
    `Track your order LIVE here (your Order ID is already filled in):`,
    trackUrl,
    ``,
    `Questions? Reply to this email, call ${supportPhone}, or write to ${supportEmail}.`,
    ``,
    `${siteName}`,
    siteUrl,
  ]
    .filter((line) => line !== '')
    .join('\n');

  const itemRows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;color:#2b1d10;font-size:13px;">${esc(i.name)} <span style="color:#8a7654;">× ${esc(i.quantity)}</span></td>
        <td style="padding:8px 0;color:#2b1d10;font-size:13px;font-weight:700;text-align:right;white-space:nowrap;">${esc(money(i.price * i.quantity, currency))}</td>
      </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#faf6ef;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf6ef;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8ddc9;box-shadow:0 18px 45px rgba(43,29,16,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#28551c,#52b788);padding:28px 32px;">
                <div style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.2px;">🍞 ${esc(siteName)}</div>
                <div style="color:rgba(255,255,255,0.85);font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;">Order Confirmation</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="color:#2b1d10;font-size:16px;line-height:1.6;margin:0 0 18px;">
                  Dear <strong>${esc(customerName)}</strong>,<br />
                  Thank you for ordering from ${esc(siteName)}. Your order is in and our bakers are on it.
                </p>
                <div style="background:#f4fbf3;border:1.5px dashed #28551c;border-radius:14px;padding:18px;text-align:center;margin:0 0 20px;">
                  <div style="color:#8a7654;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Your Order ID</div>
                  <div style="color:#28551c;font-size:24px;font-weight:800;letter-spacing:1px;margin-top:4px;">${esc(orderId)}</div>
                  <div style="margin-top:14px;">
                    <a href="${esc(trackUrl)}" style="display:inline-block;background:#28551c;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:13px 30px;border-radius:9999px;">Track Your Order Live →</a>
                  </div>
                  <div style="color:#8a7654;font-size:11.5px;margin-top:10px;">Tap the button — your Order ID opens pre-filled, status refreshes live.</div>
                </div>
                <div style="font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#28551c;margin:0 0 8px;">Order Summary</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f1e9d6;margin:0 0 8px;">
                  ${itemRows}
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f1e9d6;margin:0 0 26px;">
                  ${row('Subtotal', esc(money(subtotal, currency)))}
                  ${row('Delivery', deliveryFee === 0 ? 'FREE' : esc(money(deliveryFee, currency)))}
                  ${row('Total', `<strong>${esc(money(total, currency))}</strong> <span style="color:#8a7654;font-weight:500;">(${esc(paymentMethod)})</span>`)}
                </table>
                <div style="font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#28551c;margin:0 0 8px;">Delivery Details</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f1e9d6;margin:0 0 26px;">
                  ${row('Name', esc(customerName))}
                  ${row('Phone', esc(customerPhone))}
                  ${row('Address', esc(customerAddress))}
                  ${deliveryDate ? row('Delivery slot', esc(`${deliveryDate}${deliveryTime ? ` · ${deliveryTime}` : ''}`)) : ''}
                  ${variant ? row('Variant', esc(variant)) : ''}
                  ${messageOnItem ? row('Message on item', `&ldquo;${esc(messageOnItem)}&rdquo;`) : ''}
                </table>
                ${notes ? `<div style="background:#fffdf5;border:1px solid #e8ddc9;border-radius:12px;padding:12px 16px;margin:0 0 24px;"><span style="color:#8a7654;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:4px;">Your instructions</span><div style="color:#2b1d10;font-size:13px;line-height:1.6;white-space:pre-wrap;">${esc(notes)}</div></div>` : ''}
                <div style="background:#f4fbf3;border:1px solid #cde6d0;border-radius:14px;padding:16px 18px;margin:0 0 24px;">
                  <div style="color:#28551c;font-size:13px;font-weight:700;margin-bottom:4px;">What happens next?</div>
                  <ol style="margin:0;padding-left:18px;color:#28551c;font-size:12.5px;line-height:1.8;">
                    <li>Our bakers confirm and start preparing your treats fresh.</li>
                    <li>Track live status with the green button above — no login needed.</li>
                    <li>${paymentMethod.toLowerCase().includes('visit') ? 'Visit us in Lokanthali and pay in person when you pick up.' : 'Pay in cash when your order arrives at your door.'}</li>
                  </ol>
                </div>
                <p style="color:#2b1d10;font-size:13px;line-height:1.7;margin:0;">
                  Questions? Reply to this email, call ${esc(supportPhone)} or write to
                  <a href="mailto:${esc(supportEmail)}" style="color:#28551c;text-decoration:none;font-weight:700;">${esc(supportEmail)}</a>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#faf6ef;border-top:1px solid #e8ddc9;padding:20px 32px;text-align:center;color:#8a7654;font-size:11.5px;line-height:1.7;">
                &copy; ${new Date().getFullYear()} ${esc(siteName)} &middot; Lokanthali, Bhaktapur, Nepal<br />
                <a href="${esc(siteUrl)}" style="color:#28551c;text-decoration:none;">${esc(siteUrl)}</a>
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

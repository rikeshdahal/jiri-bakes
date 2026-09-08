import 'server-only';
import { getDbProducts, getDbSettings } from '@/lib/db';
import { sendMail } from '@/lib/email/mailer';
import { getSmtpSettings } from '@/lib/email/config';
import { orderConfirmationEmail } from '@/lib/email/templates/order-confirmation';
import { orderNotificationEmail } from '@/lib/email/templates/order-notification';
import { orderStatusEmail, type OrderStatusKey } from '@/lib/email/templates/order-status';
import { cleanText } from '@/lib/validations/order';
import type { Order } from '@/types';

export interface VerifiedItem {
  product_id?: string;
  name: string;
  price: number; // authoritative unit price
  quantity: number;
}

export interface CreateOrderInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  items: { product_id?: string; name: string; price: number; quantity: number }[];
  payment_method: 'Cash on Delivery' | 'Visit Store / Pay in Person';
  variant?: 'Egg' | 'Eggless';
  message_on_item?: string;
  item_note?: string;
  delivery_date: string;
  delivery_time: string;
  delivery_location?: string;
  notes?: string;
}

/** Delivery fee rule — must match the storefront logic. */
export function deliveryFeeFor(subtotal: number, visitStore: boolean): number {
  if (visitStore) return 0;
  if (subtotal <= 0) return 0;
  return subtotal >= 2000 ? 0 : 100;
}

export function generateOrderReference(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `JB-${year}-${rand}`;
}

async function siteInfo() {
  try {
    const settings = await getDbSettings();
    const get = (k: string) => settings.find((s) => s.key === k)?.value ?? '';
    return {
      siteName: get('site_name') || 'Jiri Bakes',
      supportEmail: get('email') || 'hello@jiribakes.com.np',
      supportPhone: get('phone') || '+977 1-4567890',
      currency: get('currency_symbol') || 'NPR',
    };
  } catch {
    return {
      siteName: 'Jiri Bakes',
      supportEmail: 'hello@jiribakes.com.np',
      supportPhone: '+977 1-4567890',
      currency: 'NPR',
    };
  }
}

function baseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit && !/localhost|127\.0\.0\.1|\.local:/.test(explicit)) {
    return explicit.replace(/\/$/, '');
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000';
  return 'https://jiribakes.com.np';
}

export interface PriceResult {
  items: VerifiedItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

/**
 * Recompute pricing from authoritative product prices.
 * Unknown product_ids fall back to the client-sent price (custom items like
 * variant surcharges), clamped to a sane range. Quantities are clamped.
 */
export async function verifyAndPrice(input: CreateOrderInput): Promise<PriceResult> {
  const products = await getDbProducts();
  const byId = new Map(products.map((p) => [String(p.id), p]));

  const items: VerifiedItem[] = input.items.map((raw) => {
    const qty = Math.max(1, Math.min(100, Math.floor(Number(raw.quantity) || 1)));
    const pid = (raw.product_id ?? '').toString().trim();
    const found = pid ? byId.get(pid) : undefined;
    if (found) {
      return {
        product_id: String(found.id),
        name: found.name,
        price: Math.max(0, Math.min(1_000_000, Number(found.price) || 0)),
        quantity: qty,
      };
    }
    // Custom / unknown item — sanitise name, clamp price.
    return {
      product_id: pid || undefined,
      name: cleanText(raw.name, 160) || 'Bakery item',
      price: Math.max(0, Math.min(1_000_000, Number(raw.price) || 0)),
      quantity: qty,
    };
  });

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const visitStore = input.payment_method === 'Visit Store / Pay in Person';
  const deliveryFee = deliveryFeeFor(subtotal, visitStore);
  return { items, subtotal, deliveryFee, total: subtotal + deliveryFee };
}

export interface OrderMailStatus {
  customer: boolean;
  staff: boolean;
}

/** Fire order confirmation + staff alert. Best-effort — never throws. */
export async function sendOrderEmails(order: Order, opts: {
  subtotal: number;
  deliveryFee: number;
  variant?: string;
  messageOnItem?: string;
  deliveryDate?: string;
  deliveryTime?: string;
}): Promise<OrderMailStatus> {
  const status: OrderMailStatus = { customer: false, staff: false };
  const settings = getSmtpSettings();
  if (!settings) {
    console.warn('[orders] SMTP not configured — order emails skipped.');
    return status;
  }

  const site = await siteInfo();
  const url = baseUrl();

  const confirmation = orderConfirmationEmail({
    siteName: site.siteName,
    siteUrl: url,
    supportEmail: site.supportEmail,
    supportPhone: site.supportPhone,
    orderId: order.id,
    customerName: order.customer_name,
    customerEmail: order.customer_email ?? '',
    customerPhone: order.customer_phone,
    customerAddress: order.customer_address,
    paymentMethod: order.payment_method ?? 'Cash on Delivery',
    items: order.items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
    subtotal: opts.subtotal,
    deliveryFee: opts.deliveryFee,
    total: order.total,
    currency: site.currency,
    variant: opts.variant,
    messageOnItem: opts.messageOnItem,
    deliveryDate: opts.deliveryDate,
    deliveryTime: opts.deliveryTime,
    notes: order.notes,
  });

  const notifyTargets =
    settings.notifyTo.length > 0 ? settings.notifyTo : site.supportEmail ? [site.supportEmail] : [];

  // Staff alert (skip duplicate send if staff list contains the customer).
  if (notifyTargets.length > 0) {
    const staffOnly = notifyTargets.filter(
      (a) => a.toLowerCase() !== (order.customer_email ?? '').toLowerCase(),
    );
    if (staffOnly.length > 0 || !order.customer_email) {
      const targets = staffOnly.length > 0 ? staffOnly : notifyTargets;
      const notification = orderNotificationEmail({
        siteName: site.siteName,
        adminUrl: `${url}/admin/orders`,
        orderId: order.id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        customerEmail: order.customer_email,
        customerAddress: order.customer_address,
        paymentMethod: order.payment_method ?? 'Cash on Delivery',
        items: order.items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
        total: order.total,
        currency: site.currency,
        deliveryDate: opts.deliveryDate,
        deliveryTime: opts.deliveryTime,
        variant: opts.variant,
        messageOnItem: opts.messageOnItem,
        notes: order.notes,
      });
      const staffResult = await sendMail({
        to: targets,
        subject: notification.subject,
        html: notification.html,
        text: notification.text,
      });
      status.staff = staffResult.ok;
    }
  }

  // Customer confirmation — only when we have an address to send to.
  if (order.customer_email) {
    const customerResult = await sendMail({
      to: order.customer_email,
      subject: confirmation.subject,
      html: confirmation.html,
      text: confirmation.text,
    });
    status.customer = customerResult.ok;
  }

  return status;
}

/** Fire a status-change email to the customer. Best-effort — never throws. */
export async function sendStatusEmail(order: Order): Promise<boolean> {
  if (!order.customer_email) return false;
  const settings = getSmtpSettings();
  if (!settings) return false;
  const site = await siteInfo();
  const allowed: OrderStatusKey[] = [
    'pending', 'confirmed', 'baking', 'preparing', 'ready', 'delivered', 'completed', 'cancelled',
  ];
  const status = (allowed.includes(order.status as OrderStatusKey) ? order.status : 'pending') as OrderStatusKey;
  const { subject, html, text } = orderStatusEmail({
    siteName: site.siteName,
    siteUrl: baseUrl(),
    supportEmail: site.supportEmail,
    supportPhone: site.supportPhone,
    orderId: order.id,
    customerName: order.customer_name,
    status,
    total: order.total,
    currency: site.currency,
  });
  const res = await sendMail({ to: order.customer_email, subject, html, text });
  return res.ok;
}

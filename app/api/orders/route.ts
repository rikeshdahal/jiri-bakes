import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getDbOrders, createDbOrder } from '@/lib/db';
import { pushOrderNotification } from '@/app/api/notifications/route';
import { orderSchema, cleanText } from '@/lib/validations/order';
import { verifyAndPrice, generateOrderReference, sendOrderEmails } from '@/lib/services/orders';
import { slidingWindowRateLimit } from '@/lib/utils/rate-limit';
import type { OrderItem } from '@/types';

function clientIpKey(prefix: string, fallback: string): string {
  return `${prefix}:${fallback}`.slice(0, 80);
}

async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const raw =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
    return raw.slice(0, 64);
  } catch {
    return 'unknown';
  }
}

async function requireAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

// GET /api/orders — admin only. Customers must use /api/track.
export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await getDbOrders();
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/orders — public checkout. Rate-limited, validated, server-priced.
export async function POST(request: Request) {
  try {
    // ── Rate limit: 5 orders / 10 min per IP ──
    const ip = await getClientIp();
    const limit = slidingWindowRateLimit(clientIpKey('order', ip), 5);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many orders from this connection. Please wait a few minutes and try again.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds ?? 60) } },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // ── Validate shape ──
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first ? `${first.path.join('.')}: ${first.message}` : 'Please check the highlighted fields and try again.' },
        { status: 400 },
      );
    }
    const v = parsed.data;

    // Eggless cakes need 24h notice (also enforced in UI).
    if (v.variant === 'Eggless' && v.delivery_date) {
      const d = new Date(v.delivery_date);
      d.setHours(0, 0, 0, 0);
      const tomorrow = new Date();
      tomorrow.setHours(0, 0, 0, 0);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (d.getTime() < tomorrow.getTime()) {
        return NextResponse.json(
          { error: 'Eggless cakes need at least 24 hours notice. Please pick a later delivery date.' },
          { status: 400 },
        );
      }
    }

    // ── Server-side pricing (never trust client total) ──
    const pricing = await verifyAndPrice({
      customer_name: v.customer_name,
      customer_phone: v.customer_phone,
      customer_email: v.customer_email || undefined,
      customer_address: v.customer_address,
      items: v.items,
      payment_method: v.payment_method,
      variant: v.variant,
      message_on_item: v.message_on_item || undefined,
      item_note: v.item_note || undefined,
      delivery_date: v.delivery_date,
      delivery_time: v.delivery_time,
      delivery_location: v.delivery_location || undefined,
      notes: v.notes || undefined,
    });

    if (pricing.items.length === 0) {
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 });
    }

    const cleanNotes = [
      `Variant: ${v.variant ?? 'Egg'}`,
      v.message_on_item ? `Message: "${cleanText(v.message_on_item, 200)}"` : null,
      v.item_note ? `Note: ${cleanText(v.item_note, 500)}` : null,
      `Delivery Slot: ${v.delivery_date} (${v.delivery_time})`,
      v.notes ? `Instructions: ${cleanText(v.notes, 2000)}` : null,
    ]
      .filter(Boolean)
      .join(' • ');

    const orderId = generateOrderReference();

    const data = await createDbOrder({
      id: orderId,
      customer_name: cleanText(v.customer_name, 120) || 'Guest Customer',
      customer_phone: cleanText(v.customer_phone, 24),
      customer_email: (v.customer_email || '').toLowerCase(),
      customer_address:
        v.payment_method === 'Visit Store / Pay in Person'
          ? 'Visit to store – Lokanthali, Bhaktapur'
          : cleanText(v.customer_address, 300),
      items: pricing.items.map((i) => ({
        product_id: i.product_id,
        name: v.variant ? `${i.name} [${v.variant}]` : i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      total: pricing.total,
      payment_method: v.payment_method,
      status: 'pending',
      notes: cleanNotes,
      variant: v.variant,
      message_on_item: cleanText(v.message_on_item || '', 200),
      item_note: cleanText(v.item_note || '', 500),
      delivery_date: v.delivery_date,
      delivery_time: v.delivery_time,
      delivery_location:
        v.payment_method === 'Visit Store / Pay in Person'
          ? 'Store Visit'
          : cleanText(v.delivery_location || v.customer_address, 300),
    });

    // Push real-time notification to all connected admin SSE clients
    try {
      pushOrderNotification({
        id: data.id,
        customer_name: data.customer_name,
        payment_method: data.payment_method,
        total: data.total,
        items: (data.items as OrderItem[]).map((i) => ({
          name: i.name,
          quantity: i.quantity,
        })),
        created_at: data.created_at,
      });
    } catch {
      // Non-fatal — notifications are best-effort
    }

    // ── Emails (best-effort — never fail the order) ──
    let mail = { customer: false, staff: false };
    try {
      mail = await sendOrderEmails(data, {
        subtotal: pricing.subtotal,
        deliveryFee: pricing.deliveryFee,
        variant: v.variant,
        messageOnItem: v.message_on_item || undefined,
        deliveryDate: v.delivery_date,
        deliveryTime: v.delivery_time,
      });
    } catch (e) {
      console.error('[orders] email dispatch failed:', e instanceof Error ? e.message : e);
    }

    return NextResponse.json({ data, mail }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getDbOrders } from '@/lib/db';
import { slidingWindowRateLimit } from '@/lib/utils/rate-limit';
import type { Order, OrderItem } from '@/types';

export async function GET(request: Request) {
  try {
    // Rate limit: 20 lookups / 10 min per IP (generous for tracking UX).
    try {
      const h = await headers();
      const rawIp =
        h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
      const limit = slidingWindowRateLimit(`track:${rawIp.slice(0, 64)}`, 20);
      if (!limit.ok) {
        return NextResponse.json(
          { error: 'Too many lookups. Please wait a moment and try again.' },
          { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds ?? 60) } },
        );
      }
    } catch {
      // headers() unavailable in some runtimes — skip rate limit, still serve.
    }

    const { searchParams } = new URL(request.url);
    const orderId = (searchParams.get('id') || '').trim().slice(0, 64);
    const phone = (searchParams.get('phone') || '').trim().slice(0, 32);

    if (!orderId && !phone) {
      return NextResponse.json({ error: 'Provide an order id or phone number' }, { status: 400 });
    }

    const allOrders: Order[] = await getDbOrders();

    let orders: Order[];
    if (orderId) {
      const q = orderId.toLowerCase();
      orders = allOrders.filter((o) => o.id.toLowerCase() === q);
    } else {
      const normalised = (phone || '').replace(/[\s\-+]/g, '').slice(-12);
      if (normalised.length < 6) {
        return NextResponse.json({ error: 'Phone number is too short.' }, { status: 400 });
      }
      orders = allOrders
        .filter((o) => {
          const p = (o.customer_phone || '').replace(/[\s\-+]/g, '').slice(-12);
          return p.length >= 6 && (p.endsWith(normalised) || normalised.endsWith(p));
        })
        .slice(0, 5); // never dump the whole book via a short suffix
    }

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'No orders found. Check your Order ID or phone number.' },
        { status: 404 }
      );
    }

    // Return only safe customer-facing fields (no email, no internal notes).
    const safe = orders.map((o) => ({
      id:               o.id,
      customer_name:    o.customer_name,
      customer_phone:   o.customer_phone,
      customer_address: o.customer_address,
      delivery_date:    o.delivery_date,
      delivery_time:    o.delivery_time,
      payment_method:   o.payment_method,
      items: (o.items as OrderItem[]).map((i) => ({
        name:     i.name,
        quantity: i.quantity,
        price:    i.price,
      })),
      total:      o.total,
      status:     o.status,
      created_at: o.created_at,
    }));

    return NextResponse.json({ data: safe });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

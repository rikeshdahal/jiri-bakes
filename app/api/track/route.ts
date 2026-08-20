import { NextResponse } from 'next/server';
import { getDbOrders } from '@/lib/db';
import type { Order, OrderItem } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const phone   = searchParams.get('phone');

    if (!orderId && !phone) {
      return NextResponse.json({ error: 'Provide an order id or phone number' }, { status: 400 });
    }

    const allOrders: Order[] = await getDbOrders();

    let orders: Order[];
    if (orderId) {
      orders = allOrders.filter((o) => o.id.toLowerCase() === orderId.toLowerCase());
    } else {
      const normalised = (phone || '').replace(/[\s\-+]/g, '');
      orders = allOrders.filter((o) => {
        const p = (o.customer_phone || '').replace(/[\s\-+]/g, '');
        return p.endsWith(normalised) || normalised.endsWith(p);
      });
    }

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'No orders found. Check your Order ID or phone number.' },
        { status: 404 }
      );
    }

    // Return only safe customer-facing fields
    const safe = orders.map((o) => ({
      id:               o.id,
      customer_name:    o.customer_name,
      customer_phone:   o.customer_phone,
      customer_address: o.customer_address,
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

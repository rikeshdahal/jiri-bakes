import { NextResponse } from 'next/server';
import { getDbOrders, createDbOrder } from '@/lib/db';
import { pushOrderNotification } from '@/app/api/notifications/route';
import type { OrderItem } from '@/types';

export async function GET() {
  try {
    const data = await getDbOrders();
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    if (!body?.customer_name || typeof body.customer_name !== 'string') {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 });
    }
    const data = await createDbOrder(body);

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

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

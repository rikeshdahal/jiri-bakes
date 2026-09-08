import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDbOrderById } from '@/lib/db';
import { sendOrderEmails, sendStatusEmail } from '@/lib/services/orders';

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

type Ctx = { params: Promise<{ id: string }> };

// POST /api/orders/:id/resend?kind=confirmation|status — admin only.
export async function POST(request: Request, { params }: Ctx) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const order = await getDbOrderById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const kind = searchParams.get('kind') === 'status' ? 'status' : 'confirmation';

    if (kind === 'status') {
      const ok = await sendStatusEmail(order);
      return NextResponse.json({ data: { resent: ok } });
    }

    // Recompute subtotal/delivery from stored total is not possible exactly,
    // so derive delivery fee from payment method + total heuristics is wrong.
    // Instead: confirmation resend uses stored items; delivery fee shown as
    // FREE vs included — recompute via rule from item subtotal.
    const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const visit = (order.payment_method ?? '').toLowerCase().includes('visit');
    const deliveryFee = visit ? 0 : subtotal <= 0 || subtotal >= 2000 ? 0 : 100;

    const mail = await sendOrderEmails(order, {
      subtotal,
      deliveryFee,
      variant: order.variant,
      messageOnItem: order.message_on_item,
      deliveryDate: order.delivery_date,
      deliveryTime: order.delivery_time,
    });
    return NextResponse.json({ data: { mail } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getDbOrderById, updateDbOrder, deleteDbOrder } from '@/lib/db';
import { statusSchema } from '@/lib/validations/order';
import { sendStatusEmail } from '@/lib/services/orders';
import { requireAdmin } from '@/lib/auth/admin';
import { cleanText } from '@/lib/validations/order';

type Ctx = { params: Promise<{ id: string }> };

// Admin-editable fields on an order (excludes id, created_at, total, status).
// Prevents mass-assignment of protected fields even by admins.
const ADMIN_EDITABLE_FIELDS = new Set([
  'customer_name', 'customer_phone', 'customer_email', 'customer_address',
  'notes', 'delivery_date', 'delivery_time', 'delivery_location',
  'payment_method', 'variant', 'message_on_item', 'item_note',
]);

export async function GET(_request: Request, { params }: Ctx) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const data = await getDbOrderById(id);
    if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Ctx) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Status-only updates go through strict validation + trigger a customer email.
    if (body && typeof body === 'object' && 'status' in (body as Record<string, unknown>)) {
      const parsed = statusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
      }
      const existing = await getDbOrderById(id);
      if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

      const data = await updateDbOrder(id, { status: parsed.data.status });
      if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

      // Notify the customer on status change (best-effort).
      let mailSent = false;
      if (existing.status !== parsed.data.status) {
        try {
          mailSent = await sendStatusEmail(data);
        } catch (e) {
          console.error('[orders] status email failed:', e instanceof Error ? e.message : e);
        }
      }

      return NextResponse.json({ data, mailSent });
    }

    // Generic admin edit — only allow explicitly whitelisted fields.
    // This prevents mass-assignment of protected fields like `id`, `total`, `items`.
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const safeUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (ADMIN_EDITABLE_FIELDS.has(key)) {
        safeUpdates[key] = typeof value === 'string' ? cleanText(value, 500) : value;
      }
    }
    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    const data = await updateDbOrder(id, safeUpdates);
    if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const success = await deleteDbOrder(id);
    if (!success) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ data: { success: true } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

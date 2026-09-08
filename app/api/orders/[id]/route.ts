import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDbOrderById, updateDbOrder, deleteDbOrder } from '@/lib/db';
import { statusSchema } from '@/lib/validations/order';
import { sendStatusEmail } from '@/lib/services/orders';

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

    // Generic admin edit (notes, address, etc.) — still admin-only.
    const data = await updateDbOrder(id, body as Record<string, unknown>);
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

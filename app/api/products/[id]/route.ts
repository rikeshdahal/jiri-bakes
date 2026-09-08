import { NextResponse } from 'next/server';
import { getDbProductById, updateDbProduct, deleteDbProduct } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await getDbProductById(id);
    if (!data) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const data = await updateDbProduct(id, body);
    if (!data) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const success = await deleteDbProduct(id);
    if (!success) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ data: { success: true } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

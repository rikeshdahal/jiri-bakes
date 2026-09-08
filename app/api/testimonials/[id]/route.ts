import { NextResponse } from 'next/server';
import { updateDbTestimonial, deleteDbTestimonial } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const data = await updateDbTestimonial(id, body);
    if (!data) return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
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
    const success = await deleteDbTestimonial(id);
    if (!success) return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    return NextResponse.json({ data: { success: true } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

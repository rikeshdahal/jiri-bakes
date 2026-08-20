import { NextResponse } from 'next/server';
import { getDbTestimonials, createDbTestimonial } from '@/lib/db';

export async function GET() {
  try {
    const data = await getDbTestimonials();
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.text) {
      return NextResponse.json({ error: 'Name and text are required' }, { status: 400 });
    }
    const data = await createDbTestimonial(body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

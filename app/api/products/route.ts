import { NextResponse } from 'next/server';
import { getDbProducts, createDbProduct } from '@/lib/db';

export async function GET() {
  try {
    const data = await getDbProducts();
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
    if (!body?.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }
    const data = await createDbProduct(body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

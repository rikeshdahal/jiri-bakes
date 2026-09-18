import { NextResponse } from 'next/server';
import { getDbCakeMenuItems, createDbCakeMenuItem } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';

export async function GET() {
  try {
    const data = await getDbCakeMenuItems();
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    if (!body?.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Cake name is required' }, { status: 400 });
    }
    if (body.price === undefined || isNaN(Number(body.price))) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }
    const data = await createDbCakeMenuItem(body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

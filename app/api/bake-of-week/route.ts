import { NextResponse } from 'next/server';
import { getDbBakeOfWeek, createDbBakeOfWeek } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';

export async function GET() {
  try {
    const data = await getDbBakeOfWeek();
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
    const body = await request.json();
    if (!body || !body.title || body.price == null) {
      return NextResponse.json({ error: 'Title and price are required.' }, { status: 400 });
    }
    const item = await createDbBakeOfWeek(body);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

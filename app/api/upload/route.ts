import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/auth/admin';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, WEBP, GIF or AVIF images are allowed' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5 MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanExt = fileExt.replace(/[^a-zA-Z0-9]/g, '');
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${cleanExt}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      data: {
        url: publicUrl,
        path: publicUrl,
        fileName,
      },
    });
  } catch (err: unknown) {
    // Serverless hosts (Vercel) have a read-only filesystem — uploads can't
    // persist there. Surface a clear message instead of a raw EROFS dump.
    const code = (err as { code?: unknown })?.code;
    if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
      return NextResponse.json(
        { error: 'File uploads are not available on this hosting. Paste an image URL instead.' },
        { status: 503 },
      );
    }
    const msg = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function shouldUseSupabaseStorage() {
  return process.env.USE_SUPABASE_DB === 'true';
}

function newFileName(file: File) {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanExt = fileExt.replace(/[^a-zA-Z0-9]/g, '');
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${cleanExt}`;
}

async function saveToSupabase(file: File): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    throw new Error('Supabase is not configured for file uploads');
  }

  const key = SERVICE_ROLE_KEY || supabaseAnon;
  const supabase = createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const fileName = newFileName(file);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, buffer, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

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

    // On serverless hosts (Vercel) the filesystem is read-only, so upload
    // directly to Supabase Storage instead of writing to disk.
    if (shouldUseSupabaseStorage()) {
      const publicUrl = await saveToSupabase(file);
      return NextResponse.json({
        data: {
          url: publicUrl,
          path: publicUrl,
          fileName: publicUrl.split('/').pop(),
        },
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = newFileName(file);
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


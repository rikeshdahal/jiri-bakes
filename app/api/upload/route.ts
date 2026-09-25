import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Allowed file extensions — must match allowed MIME types.
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);

/**
 * Validate the actual file bytes against known image magic bytes.
 * This prevents MIME type spoofing where an attacker sets Content-Type
 * to image/jpeg but uploads a script or HTML file.
 */
function validateMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) return true;
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true;
  // WEBP: 52 49 46 46 ... 57 45 42 50
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return true;
  // AVIF / HEIC: starts with a ftyp box - check for 'ftyp' at bytes 4-8
  if (buffer.length >= 12 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) return true;

  return false;
}

function shouldUseSupabaseStorage() {
  return process.env.USE_SUPABASE_DB === 'true';
}

function newFileName(ext: string) {
  const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 8);
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${cleanExt || 'bin'}`;
}

async function saveToSupabase(buffer: Buffer, contentType: string, ext: string): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    throw new Error('Supabase is not configured for file uploads');
  }

  const key = SERVICE_ROLE_KEY || supabaseAnon;
  const supabase = createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const fileName = newFileName(ext);

  // If using service role key, attempt to auto-create bucket if missing
  if (SERVICE_ROLE_KEY) {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (buckets && !buckets.some((b) => b.name === STORAGE_BUCKET)) {
        await supabase.storage.createBucket(STORAGE_BUCKET, { public: true });
      }
    } catch {
      // Ignore bucket check failure and proceed with upload
    }
  }

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, buffer, {
    contentType,
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    if (error.message?.toLowerCase().includes('bucket not found')) {
      throw new Error(
        `Supabase Storage bucket "${STORAGE_BUCKET}" does not exist. Please create a public bucket named "${STORAGE_BUCKET}" in Supabase -> Storage.`,
      );
    }
    throw error;
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized: Admin login required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 1. Check browser-reported MIME type (first line of defense)
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, WEBP, GIF or AVIF images are allowed' }, { status: 400 });
    }

    // 2. Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5 MB.' }, { status: 400 });
    }

    // 3. Read actual bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Check file extension from original filename (sanitised)
    const rawExt = (file.name.split('.').pop() ?? '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(rawExt)) {
      return NextResponse.json({ error: 'Invalid file extension.' }, { status: 400 });
    }

    // 5. Validate magic bytes — prevents MIME spoofing
    if (!validateMagicBytes(buffer)) {
      return NextResponse.json({ error: 'File content does not match an allowed image format.' }, { status: 400 });
    }

    // On serverless hosts (Vercel) the filesystem is read-only, so upload
    // directly to Supabase Storage instead of writing to disk.
    if (shouldUseSupabaseStorage()) {
      const publicUrl = await saveToSupabase(buffer, file.type, rawExt);
      return NextResponse.json({
        url: publicUrl,
        data: {
          url: publicUrl,
          path: publicUrl,
          fileName: publicUrl.split('/').pop(),
        },
      });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = newFileName(rawExt);
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      url: publicUrl,
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

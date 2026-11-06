import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { uploadFile, isS3Configured } from '@/lib/s3';
import { logger } from '@/lib/logger';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

/**
 * POST /api/upload
 *
 * Auth-gated multipart upload to S3. Accepts a single `file` field and an
 * optional `key` (path prefix) in the form data. Returns `{ url, key }`.
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isS3Configured()) {
    return NextResponse.json({ error: 'S3 is not configured' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 });
  }

  const file = formData.get('file');
  // `instanceof File` breaks across realms (test/Node FormData); a string
  // entry is the only non-file shape FormData can return.
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: '`file` field is required' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 5 MB limit' }, { status: 413 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Unsupported content type: ${file.type}` }, { status: 415 });
  }

  const prefix =
    ((formData.get('key') as string | null) ?? '')
      .replace(/[^a-zA-Z0-9/_-]/g, '')
      .replace(/^\/+|\/+$/g, '') || 'uploads';
  const ext = (file.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(key, buffer, file.type);
    return NextResponse.json({ ok: true, url, key });
  } catch (error) {
    logger.error({ error, key }, 'S3 upload failed');
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

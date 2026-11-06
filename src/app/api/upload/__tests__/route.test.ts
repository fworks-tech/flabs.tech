import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const s3Mock = vi.hoisted(() => ({
  uploadFile: vi.fn(),
  isS3Configured: vi.fn(() => true),
}));

vi.mock('@/lib/s3', () => s3Mock);

vi.mock('@/lib/auth', () => ({
  isAuthenticated: vi.fn(async () => true),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { isAuthenticated } from '@/lib/auth';
import { uploadFile } from '@/lib/s3';
import { POST } from '../route';

/**
 * The route only reads `request.formData()`. Building that directly avoids a
 * jsdom/undici FormData realm mismatch that made `new NextRequest(...)` drop
 * the body on CI.
 */
function formRequest(file: File | null, key?: string): NextRequest {
  const body = new FormData();
  if (file) body.append('file', file);
  if (key) body.append('key', key);
  return { formData: async () => body } as unknown as NextRequest;
}

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockResolvedValue(true);
    s3Mock.isS3Configured.mockReturnValue(true);
    s3Mock.uploadFile.mockReset();
  });

  it('rejects unauthenticated requests', async () => {
    vi.mocked(isAuthenticated).mockResolvedValue(false);
    const res = await POST(formRequest(new File(['x'], 'a.png', { type: 'image/png' })));
    expect(res.status).toBe(401);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('returns 503 when S3 is not configured', async () => {
    s3Mock.isS3Configured.mockReturnValue(false);
    const res = await POST(formRequest(new File(['x'], 'a.png', { type: 'image/png' })));
    expect(res.status).toBe(503);
  });

  it('rejects a missing file', async () => {
    const res = await POST(formRequest(null));
    expect(res.status).toBe(400);
  });

  it('rejects unsupported content types', async () => {
    const res = await POST(
      formRequest(new File(['x'], 'a.exe', { type: 'application/octet-stream' })),
    );
    expect(res.status).toBe(415);
  });

  it('uploads and returns the public URL', async () => {
    s3Mock.uploadFile.mockResolvedValue('https://bucket.s3.us-east-1.amazonaws.com/uploads/x.png');
    const res = await POST(formRequest(new File(['x'], 'a.png', { type: 'image/png' })));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; url: string; key: string };
    expect(body.ok).toBe(true);
    expect(body.key).toMatch(/^uploads\//);
    expect(uploadFile).toHaveBeenCalledOnce();
  });

  it('sanitizes the key prefix and extension', async () => {
    s3Mock.uploadFile.mockResolvedValue('https://bucket/x.png');
    const res = await POST(
      formRequest(new File(['x'], 'a.png', { type: 'image/png' }), '../../imgs'),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { key: string };
    expect(body.key).toMatch(/^imgs\/[a-z0-9]+-[a-z0-9]+\.png$/);
  });
});

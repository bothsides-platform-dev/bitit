import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockUpload, mockDownload, mockRemove, mockFrom } = vi.hoisted(() => {
  const mockUpload = vi.fn();
  const mockDownload = vi.fn();
  const mockRemove = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({
    upload: mockUpload,
    download: mockDownload,
    remove: mockRemove,
  });
  return { mockUpload, mockDownload, mockRemove, mockFrom };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    storage: { from: mockFrom },
  }),
}));

import { SupabaseStorage } from '../supabase';
import { newAttachmentPath } from '../path';

beforeEach(() => {
  vi.clearAllMocks();
  // Re-set mockFrom implementation after clearAllMocks() wipes it.
  mockFrom.mockReturnValue({
    upload: mockUpload,
    download: mockDownload,
    remove: mockRemove,
  });
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
});

async function collectStream(s: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = s.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return Buffer.from(out);
}

describe('SupabaseStorage', () => {
  it('save() calls upload with correct key, buffer, and mime', async () => {
    mockUpload.mockResolvedValue({ error: null });
    const storage = new SupabaseStorage();
    const key = newAttachmentPath('test.pdf');
    const body = Buffer.from('PDF bytes');

    await storage.save(key, body, 'application/pdf');

    expect(mockFrom).toHaveBeenCalledWith('attachments');
    expect(mockUpload).toHaveBeenCalledWith(
      key,
      body,
      { contentType: 'application/pdf', upsert: true },
    );
  });

  it('save() throws when upload returns an error', async () => {
    mockUpload.mockResolvedValue({ error: new Error('upload failed') });
    const storage = new SupabaseStorage();

    await expect(
      storage.save('any/key.pdf', Buffer.from('x'), 'application/pdf'),
    ).rejects.toThrow('upload failed');
  });

  it('read() returns a ReadableStream and correct byte size', async () => {
    const body = Buffer.from('hello supabase');
    mockDownload.mockResolvedValue({ data: new Blob([new Uint8Array(body)]), error: null });
    const storage = new SupabaseStorage();
    const key = newAttachmentPath('hello.txt');

    const { stream, size } = await storage.read(key);

    expect(size).toBe(body.length);
    const got = await collectStream(stream);
    expect(got.equals(body as unknown as Uint8Array)).toBe(true);
  });

  it('read() throws when download returns an error', async () => {
    mockDownload.mockResolvedValue({ data: null, error: new Error('not found') });
    const storage = new SupabaseStorage();

    await expect(storage.read('missing/key.txt')).rejects.toThrow('not found');
  });

  it('delete() calls remove with key wrapped in array', async () => {
    mockRemove.mockResolvedValue({ data: [], error: null });
    const storage = new SupabaseStorage();
    const key = newAttachmentPath('bye.jpg');

    await storage.delete(key);

    expect(mockFrom).toHaveBeenCalledWith('attachments');
    expect(mockRemove).toHaveBeenCalledWith([key]);
  });
});

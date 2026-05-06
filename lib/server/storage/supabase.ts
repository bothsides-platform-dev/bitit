import { createClient } from '@supabase/supabase-js';
import type { Storage } from './local';

const BUCKET = 'attachments';

export class SupabaseStorage implements Storage {
  private sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  async save(key: string, buffer: Buffer, mime: string): Promise<void> {
    const { error } = await this.sb.storage
      .from(BUCKET)
      .upload(key, buffer, { contentType: mime, upsert: true });
    if (error) throw error;
  }

  async read(key: string): Promise<{ stream: ReadableStream<Uint8Array>; size: number }> {
    const { data, error } = await this.sb.storage.from(BUCKET).download(key);
    if (error) throw error;
    const buf = await data!.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });
    return { stream, size: bytes.byteLength };
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.sb.storage.from(BUCKET).remove([key]);
    if (error) throw error;
  }
}

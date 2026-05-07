/**
 * Storage primitives for file uploads (Step 11).
 *
 * `Storage` is the contract that file routes (`app/api/files/*`) use to
 * persist + retrieve attachment payloads. v0 has a single implementation
 * (`LocalStorage` — repo-relative `./uploads`) so a single dev/Fly node
 * can ship the feature without S3. v1 will swap a `S3Storage` (or
 * Supabase Storage) class behind this same interface — `getStorage()`
 * is the single mutation point.
 *
 * NOTE: `read` returns only `{ stream, size }` — mime is **not** sniffed
 * on read. The route layer uses the attachment row's stored
 * `mime_type` (which was magic-byte sniffed at upload time) for the
 * `Content-Type` header. This avoids re-reading the file head just to
 * pick a mime that we already know.
 */
import type { Storage } from './local';

export type { Storage };

declare global {
   
  var __bidit_storage__: Storage | undefined;
}

/**
 * Single-instance storage handle. Cached on `globalThis` so Next dev HMR
 * doesn't multiply file handles, mirroring the repository factory.
 *
 * v1: branch on `process.env.STORAGE_BACKEND` (e.g. `'s3'`) and import a
 * different implementation. The interface contract stays the same.
 */
export function getStorage(): Storage {
  if (!globalThis.__bidit_storage__) {
    if (process.env.STORAGE_BACKEND === 'supabase') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { SupabaseStorage } = require('./supabase') as typeof import('./supabase');
      globalThis.__bidit_storage__ = new SupabaseStorage();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LocalStorage } = require('./local') as typeof import('./local');
      globalThis.__bidit_storage__ = new LocalStorage();
    }
  }
  return globalThis.__bidit_storage__;
}

/**
 * For tests only — swap the storage implementation (e.g. an in-memory
 * stub) before calling routes. Pair with `__resetStorageForTest`.
 */
export function __setStorageForTest(s: Storage | undefined): void {
  globalThis.__bidit_storage__ = s;
}

export function __resetStorageForTest(): void {
  globalThis.__bidit_storage__ = undefined;
}

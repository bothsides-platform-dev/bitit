/**
 * Storage key generation — `{yyyy}/{mm}/{uuid}.{ext}`.
 *
 * Year/month prefix gives directory listings a coarse retention shape
 * (delete-by-month buckets) without forcing a row scan. UUIDv4 entropy
 * (122 bits) makes accidental collisions astronomical, so we don't
 * enforce a UNIQUE index on `attachments.storage_path` — relying on
 * `attachments.id` PK as the row identity. If a future backend is
 * deterministic-key, add the unique index there.
 *
 * If the prefix scheme ever changes (e.g. shard by workspace), keep the
 * change to this single function and run a one-time migration for old
 * rows. Routes / repos must call `newAttachmentPath` and never compose
 * a path themselves.
 */
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// `DRAFT_OWNER_ID` re-export for callers already importing from this
// module. The constant itself lives in `./constants.ts` so client
// components can import it without dragging `node:crypto`.
export { DRAFT_OWNER_ID } from './constants';

export function newAttachmentPath(filename: string): string {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  // Conservative ext sanitization: lowercase, strip anything that isn't
  // alnum or '.'. Multi-dot filenames keep only the trailing extension
  // because `path.extname` returns just the last segment.
  const rawExt = path.extname(filename).toLowerCase();
  const ext = rawExt.replace(/[^a-z0-9.]/g, '');
  const id = randomUUID();
  return `${yyyy}/${mm}/${id}${ext}`;
}

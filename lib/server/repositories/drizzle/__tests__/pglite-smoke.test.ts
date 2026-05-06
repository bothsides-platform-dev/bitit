// Smoke test: verifies createPgliteDb() applies the drizzle migrations and
// that the workspaces table is queryable. If this fails everything else does.
import { describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { createPgliteDb } from '@/lib/db/client-pglite';

describe('pglite smoke', () => {
  it('migrates and exposes workspaces table', async () => {
    const db = await createPgliteDb();
    const rows = await db.execute(sql`SELECT count(*)::int AS c FROM workspaces`);
    // pglite execute returns { rows: [...] }; tolerate either shape.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arr: any[] = Array.isArray(rows) ? rows : (rows as any).rows ?? [];
    expect(arr[0]?.c ?? 0).toBe(0);
  });
});

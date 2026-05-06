// Test harness wiring for notification-action tests. Mirrors
// auth/__tests__/_setup.ts.
import { createPgliteDb, type PgliteDB } from '@/lib/db/client-pglite';
import {
  __resetForTest,
  __useDrizzleWithDbForTest,
} from '@/lib/server/repositories/factory';
import { __setActionDbForTest } from '@/lib/server/actions/auth/_shared';

export async function setupNotifActionEnv(): Promise<PgliteDB> {
  __resetForTest();
  const db = await createPgliteDb();
  await __useDrizzleWithDbForTest(db);
  __setActionDbForTest(db);
  return db;
}

export function teardownNotifActionEnv(): void {
  __setActionDbForTest(undefined);
  __resetForTest();
}

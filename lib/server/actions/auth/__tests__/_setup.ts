// Test harness wiring for auth-action tests.
// - Creates a fresh pglite db per test.
// - Routes the factory's repo bundle through Drizzle (not in-memory) so
//   user/biz/outbox/verification-token reach a real schema.
// - Routes the action db hook (used by signupCompleteAction's tx,
//   passwordResetAction's UPDATE, emailChangeConfirmAction's UPDATE) at
//   the same handle.
import { createPgliteDb, type PgliteDB } from '@/lib/db/client-pglite';
import {
  __resetForTest,
  __useDrizzleWithDbForTest,
} from '@/lib/server/repositories/factory';
import { __setActionDbForTest } from '@/lib/server/actions/auth/_shared';

export async function setupActionEnv(): Promise<PgliteDB> {
  __resetForTest();
  const db = await createPgliteDb();
  await __useDrizzleWithDbForTest(db);
  __setActionDbForTest(db);
  return db;
}

export function teardownActionEnv(): void {
  __setActionDbForTest(undefined);
  __resetForTest();
}

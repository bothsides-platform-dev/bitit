/**
 * Playwright globalSetup — runs once before any spec.
 *
 * Responsibilities:
 *   1. Pin DATABASE_URL to DATABASE_URL_TEST (5433/bidit_test) so the dev
 *      Next server, started by `webServer` in playwright.config.ts, talks
 *      to the test DB and not to 5432.
 *   2. Run `drizzle-kit migrate` against the test DB. Idempotent — if
 *      already migrated this is a no-op.
 *   3. TRUNCATE+reseed via `scripts/test-db-reset.ts:resetTestDatabase`.
 *
 * NOTE: `globalSetup` runs once per `playwright test` invocation. Each
 * spec is responsible for handling its own state if it needs strict
 * isolation across specs. The 3 §6 scenarios are written so each one
 * can run independently against a freshly-seeded DB (Step 14 spec).
 *
 * Docker pre-req: operator must `docker compose --profile test up -d
 * pg-test` before invoking `pnpm e2e`. We don't auto-spin docker here —
 * that's an env concern (CI services / dev machine).
 */
import { execFileSync } from 'node:child_process';

const TEST_DB_FALLBACK =
  'postgres://bidit:bidit@localhost:5433/bidit_test';

export default async function globalSetup(): Promise<void> {
  const testUrl = process.env.DATABASE_URL_TEST ?? TEST_DB_FALLBACK;
  process.env.DATABASE_URL = testUrl;

  // 1. Migrate. drizzle-kit reads DATABASE_URL from env via dotenv +
  //    drizzle.config.ts. Run as a child process so the kit picks up the
  //    forced URL cleanly without colliding with the postgres-js client
  //    cached on globalThis.__bidit_pg__ in this process.
  console.log('[e2e/global-setup] running drizzle-kit migrate against test DB…');
  execFileSync('pnpm', ['db:migrate'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testUrl },
  });

  // 2. Truncate + reseed. Imported lazily so the DATABASE_URL override
  //    above is in effect before lib/db/client.ts initialises.
  const { resetTestDatabase } = await import('../scripts/test-db-reset');
  await resetTestDatabase();

  console.log('[e2e/global-setup] test DB ready.');
}

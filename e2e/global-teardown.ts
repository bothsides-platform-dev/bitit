/**
 * Playwright globalTeardown — runs once after all specs finish.
 *
 * Currently a no-op. We keep the file (and wire it in playwright.config.ts)
 * as a placeholder for future cleanup hooks: dropping uploads-e2e/, closing
 * SSE connections, archiving traces, etc.
 *
 * Test DB rows persist between e2e invocations — the next run's
 * globalSetup truncates+seeds, so cleanup here would be redundant work.
 */
export default async function globalTeardown(): Promise<void> {
  // intentionally empty
}

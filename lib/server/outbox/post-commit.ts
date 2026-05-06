// Post-commit outbox flush — fire-and-forget after a successful action tx.
//
// Action callers do:
//   const r = await db.transaction(async (tx) => { ... outbox.enqueue(tx) ... });
//   if (r.ok) flushAfterCommit();
//
// The `Promise.resolve().then(...)` schedules the drain on a microtask so the
// action returns to the caller immediately. Errors are swallowed (logged
// only) — the cron sweep is the safety net for missed work, and we never
// want a flush failure to surface as an action error to the user.
//
// v0 deliberately uses fire-and-forget rather than Vercel `after()`: the
// `after()` API stabilised in Next 15 and works in Next 16, but the rest of
// the action layer is still synchronous-await today. When we're ready to
// keep the request alive across the deploy boundary we'll swap this helper
// without changing call sites.

import { getOutboxRepo } from '@/lib/server/repositories/factory';
import { getResendSender } from '@/lib/integrations/resend';

const FLUSH_BATCH = 50;

export function flushAfterCommit(): void {
  // Don't await — caller already returned. Use Promise.resolve().then() so
  // the drain runs on the next microtask and any synchronous
  // getOutboxRepo() failure still falls into .catch.
  Promise.resolve()
    .then(async () => {
      const outbox = await getOutboxRepo();
      await outbox.flush(getResendSender(), FLUSH_BATCH);
    })
    .catch((err) => {
      console.error('post-commit flush failed', err);
    });
}

/**
 * POST /api/cron/flush-outbox
 *
 * External cron tick (Vercel cron / GitHub Actions schedule, 60s cadence in
 * v0). Drains pending outbox entries through the configured `Sender`
 * (Resend in prod, console fallback in dev).
 *
 * Auth — `Authorization: Bearer ${CRON_SECRET}`. Comparison is timing-safe:
 *   1. Fast-fail on length mismatch (timingSafeEqual throws if buffers
 *      aren't the same length).
 *   2. `crypto.timingSafeEqual` on equal-length Buffers.
 *
 * Returns `{ ok, failed, processed }` where `processed = ok + failed`.
 *
 * runtime='nodejs' — drizzle/postgres-js can't run on edge.
 * dynamic='force-dynamic' — no caching.
 */
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

import { getOutboxRepo } from '@/lib/server/repositories/factory';
import { getResendSender } from '@/lib/integrations/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FLUSH_BATCH = 50;
const BEARER_PREFIX = 'Bearer ';

function authorised(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false; // misconfigured environment — fail closed.

  const header = req.headers.get('authorization');
  if (!header || !header.startsWith(BEARER_PREFIX)) return false;

  const provided = header.slice(BEARER_PREFIX.length);
  const enc = new TextEncoder();
  const a = enc.encode(provided);
  const b = enc.encode(expected);
  // timingSafeEqual throws on length mismatch — short-circuit so a 1-char
  // typo returns 401 (not 500). This still leaks length, but length leak is
  // unavoidable here and the secret is shared, not user-derived.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request): Promise<Response> {
  if (!authorised(req)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const outbox = await getOutboxRepo();
  const { ok, failed } = await outbox.flush(getResendSender(), FLUSH_BATCH);
  return NextResponse.json({ ok, failed, processed: ok + failed });
}

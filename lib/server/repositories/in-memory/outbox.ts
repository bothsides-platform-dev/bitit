// In-memory OutboxRepo — interface parity with the Drizzle implementation.
// Used by `factory.ts` when REPO_BACKEND=memory or NODE_ENV=test (and no
// pglite handle has been swapped in via __useDrizzleWithDbForTest).
//
// Notable simplifications vs. the Drizzle impl:
//   - `flush` does not (and cannot) reproduce SKIP LOCKED semantics in a
//     single-process Map — it just iterates pending entries sequentially.
//     Concurrent flush() calls would each see the full pending set; this is
//     fine for the unit tests that exercise the in-memory path because they
//     run flush() once. The Drizzle impl is the canonical concurrency story.
//   - `markResult` mirrors the two-step "increment then maybe flip to failed"
//     pattern from drizzle/outbox.ts, so the pre-existing assertions
//     (NotificationOutboxAdapter test contract: stays pending under
//     maxAttempts, flips to failed once exceeded) survive when those tests
//     get pointed at the new repo.

import { randomUUID } from 'node:crypto';

import type {
  OutboxEntry,
  OutboxEvent,
  Sender,
} from '@/lib/server/outbox/types';
import type { OutboxRepo, Tx } from '../types';

export class InMemoryOutboxRepository implements OutboxRepo {
  private store = new Map<string, OutboxEntry>();
  private dedupeIndex = new Set<string>();

  async enqueue(
    params: {
      event: OutboxEvent;
      to: string;
      subject: string;
      html: string;
      dedupeKey?: string;
      maxAttempts?: number;
    },
    _tx?: Tx,
  ): Promise<OutboxEntry | null> {
    void _tx;
    if (params.dedupeKey && this.dedupeIndex.has(params.dedupeKey)) {
      return null;
    }
    const entry: OutboxEntry = {
      id: randomUUID(),
      event: params.event,
      to: params.to,
      subject: params.subject,
      html: params.html,
      dedupeKey: params.dedupeKey,
      status: 'pending',
      attempts: 0,
      maxAttempts: params.maxAttempts ?? 5,
      scheduledAt: new Date().toISOString(),
    };
    this.store.set(entry.id, entry);
    if (params.dedupeKey) this.dedupeIndex.add(params.dedupeKey);
    return { ...entry };
  }

  async pending(limit: number, _tx?: Tx): Promise<OutboxEntry[]> {
    void _tx;
    return [...this.store.values()]
      .filter((e) => e.status === 'pending')
      .slice(0, limit)
      .map((e) => ({ ...e }));
  }

  async markResult(
    id: string,
    result: { ok: true } | { ok: false; error: string },
    _tx?: Tx,
  ): Promise<void> {
    void _tx;
    const entry = this.store.get(id);
    if (!entry) return;
    const next: OutboxEntry = { ...entry, attempts: entry.attempts + 1 };
    if (result.ok) {
      next.status = 'sent';
      next.sentAt = new Date().toISOString();
    } else {
      next.lastError = result.error;
      if (next.attempts >= next.maxAttempts) {
        next.status = 'failed';
      }
    }
    this.store.set(id, next);
  }

  async flush(
    sender: Sender,
    limit: number = 50,
    _tx?: Tx,
  ): Promise<{ ok: number; failed: number }> {
    void _tx;
    // Single-process Map: no SKIP LOCKED to simulate. Iterate pending and
    // delegate to markResult which already handles attempts + status.
    const pending = await this.pending(limit);
    let ok = 0;
    let failed = 0;
    for (const entry of pending) {
      const result = await sender(entry);
      if (result.ok) {
        await this.markResult(entry.id, { ok: true });
        ok++;
      } else {
        await this.markResult(entry.id, {
          ok: false,
          error: result.error ?? 'unknown',
        });
        failed++;
      }
    }
    return { ok, failed };
  }

  // Test-only escape hatches — let assertions inspect the queue directly.
  // Mirrors the deleted NotificationOutboxAdapter API so the existing test
  // file can swap import sites without rewriting expectations.
  __all(): OutboxEntry[] {
    return [...this.store.values()].map((e) => ({ ...e }));
  }

  __pendingSync(): OutboxEntry[] {
    return [...this.store.values()]
      .filter((e) => e.status === 'pending')
      .map((e) => ({ ...e }));
  }
}

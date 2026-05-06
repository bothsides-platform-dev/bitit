// Forward-declaration drizzle Outbox repo. Step 10 owns full integration; this
// file lives here so the factory can return a wired instance without changing
// the import surface later.
import { eq, sql, lte, and } from 'drizzle-orm';
import { outboxEntries } from '@/lib/db/schema';
import type { DB } from '@/lib/db/client';
import type { OutboxEntry, OutboxEvent } from '../../outbox/types';
import type { OutboxRepo, Tx } from '../types';

type OutboxRow = typeof outboxEntries.$inferSelect;

function rowToEntry(row: OutboxRow): OutboxEntry {
  return {
    id: row.id,
    event: row.event as OutboxEvent,
    to: row.toAddr,
    subject: row.subject,
    html: row.html,
    dedupeKey: row.dedupeKey ?? undefined,
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.maxAttempts,
    scheduledAt: new Date(row.scheduledAt).toISOString(),
    sentAt: row.sentAt ? new Date(row.sentAt).toISOString() : undefined,
    lastError: row.lastError ?? undefined,
  };
}

export class DrizzleOutboxRepository implements OutboxRepo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly _db: DB | any) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private h(tx?: Tx): any {
    return tx ?? this._db;
  }

  async enqueue(
    params: {
      event: OutboxEvent;
      to: string;
      subject: string;
      html: string;
      dedupeKey?: string;
      maxAttempts?: number;
    },
    tx?: Tx,
  ): Promise<OutboxEntry | null> {
    const db = this.h(tx);
    const inserted = await db
      .insert(outboxEntries)
      .values({
        event: params.event,
        toAddr: params.to,
        subject: params.subject,
        html: params.html,
        dedupeKey: params.dedupeKey ?? null,
        maxAttempts: params.maxAttempts ?? 5,
      })
      .onConflictDoNothing({ target: outboxEntries.dedupeKey })
      .returning();
    return inserted.length > 0 ? rowToEntry(inserted[0]) : null;
  }

  async pending(limit: number, tx?: Tx): Promise<OutboxEntry[]> {
    const db = this.h(tx);
    const rows = await db
      .select()
      .from(outboxEntries)
      .where(
        and(
          eq(outboxEntries.status, 'pending'),
          lte(outboxEntries.scheduledAt, sql`now()`),
        ),
      )
      .limit(limit);
    return rows.map(rowToEntry);
  }

  async markResult(
    id: string,
    result: { ok: true } | { ok: false; error: string },
    tx?: Tx,
  ): Promise<void> {
    const db = this.h(tx);
    if (result.ok) {
      await db
        .update(outboxEntries)
        .set({
          status: 'sent',
          sentAt: sql`now()`,
          attempts: sql`${outboxEntries.attempts} + 1`,
        })
        .where(eq(outboxEntries.id, id));
    } else {
      // Increment attempts; flip to 'failed' when max reached. Two-step is
      // simpler than a CASE expression at this layer.
      await db
        .update(outboxEntries)
        .set({
          attempts: sql`${outboxEntries.attempts} + 1`,
          lastError: result.error,
        })
        .where(eq(outboxEntries.id, id));
      await db
        .update(outboxEntries)
        .set({ status: 'failed' })
        .where(
          and(
            eq(outboxEntries.id, id),
            sql`${outboxEntries.attempts} >= ${outboxEntries.maxAttempts}`,
          ),
        );
    }
  }
}

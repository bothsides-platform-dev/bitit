import { sql } from 'drizzle-orm';
import type { DB } from '@/lib/db/client';

/**
 * Atomically reserves the next RFQ id for the current calendar year-month.
 * Format: `Q-YYMM-NNNN` (zero-padded sequence within month).
 *
 * Pass a transaction-bound `tx` so the counter increment + RFQ insert share
 * atomicity. Calling outside a transaction is allowed but loses that guarantee.
 */
export async function nextRfqId(tx: DB): Promise<string> {
  const now = new Date();
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const result = await tx.execute(sql`
    INSERT INTO rfq_counters(year_month, last_seq) VALUES (${yymm}, 1)
    ON CONFLICT (year_month) DO UPDATE SET last_seq = rfq_counters.last_seq + 1
    RETURNING last_seq
  `);
  // postgres-js returns rows as an array; cast through unknown for portability.
  const rows = result as unknown as Array<{ last_seq: number }>;
  const seq = rows[0].last_seq;
  return `Q-${yymm}-${String(seq).padStart(4, '0')}`;
}

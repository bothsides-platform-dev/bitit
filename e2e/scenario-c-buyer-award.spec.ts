/**
 * PG_RFQ_SPEC.md §6 시나리오 C — 구매사 비교·계약.
 *
 * Buyer reviews bids, selects winner, confirms award. Verifies:
 *   - rfqs.status → 'awarded'
 *   - contracts row inserted (rfqId, winningBidId, winningPgWsId)
 *   - notifications: winner + losers
 *   - outbox_entries: rfq.awarded.winner + rfq.awarded.loser × N
 *
 * Uses the seeded RFQ `Q-2604-0001` which already has 2 submitted bids
 * (toss + inicis) — perfect for the "1 winner + N losers" check. The
 * buyer is `yeonseong.dev@gmail.com`, owner of `Q-2604-0001`.
 */
import { test, expect } from 'playwright/test';
import { sql } from 'drizzle-orm';

process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  'postgres://bidit:bidit@localhost:5433/bidit_test';

const BUYER_EMAIL = 'yeonseong.dev@gmail.com';
const BUYER_PASSWORD = 'password123';
const RFQ_ID = 'Q-2604-0001';

test.describe.serial('Scenario C — buyer awards a bid', () => {
  test('buyer logs in, opens comparison, awards toss, confirms', async ({
    page,
  }) => {
    const { db } = await import('@/lib/db/client');

    // ── Pre: ensure the RFQ is in 'sent' state (idempotent reset for ─
    // multi-run flakiness — globalSetup reseeds, but if a stale local
    // run left it 'awarded', force back to 'sent' and clear contract).
    await db.execute(
      sql`UPDATE rfqs SET status='sent', awarded_bid_id=NULL WHERE id=${RFQ_ID}`,
    );
    await db.execute(sql`DELETE FROM contracts WHERE rfq_id=${RFQ_ID}`);

    // Pick the toss bid (winner) — seeded as 'submitted'.
    const winnerRows = await db.execute<{ id: string }>(
      sql`SELECT b.id FROM bids b
          JOIN workspaces w ON w.id = b.pg_ws_id
          WHERE b.rfq_id = ${RFQ_ID} AND w.domain = 'toss.im'
          LIMIT 1`,
    );
    const winnerArr = Array.isArray(winnerRows)
      ? winnerRows
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((winnerRows as any).rows ?? []);
    expect(winnerArr.length).toBe(1);
    const winnerBidId = winnerArr[0].id;

    // ── 1. Login ─────────────────────────────────────────────────
    await page.goto('/login');
    await page.fill('input[name="email"]', BUYER_EMAIL);
    await page.fill('input[name="password"]', BUYER_PASSWORD);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL(/\/home$/);

    // ── 2. Comparison table — assert it lists submitted bids ─────
    await page.goto(`/rfq/${RFQ_ID}`);
    await expect(page.getByText('토스페이먼츠')).toBeVisible();

    // ── 3. Navigate directly to award flow w/ bidId search param ─
    // (BidComparisonTable wires this URL behind its '수주' CTA but
    //  we navigate directly to keep the spec robust against table UI
    //  changes — the integration boundary is the action call.)
    await page.goto(`/rfq/${RFQ_ID}/award?bidId=${winnerBidId}`);
    await expect(page.getByText(/수주 처리|토스페이먼츠/)).toBeVisible();

    // ── 4. Confirm award ─────────────────────────────────────────
    await page.getByRole('button', { name: /수주 확정/ }).click();

    // After confirm: AwardConfirm renders the success state in place —
    // wait for "✓ 수주 확정" header (different selector than CTA).
    await expect(page.getByText(/✓ 수주 확정|계약이 확정/)).toBeVisible({
      timeout: 15_000,
    });

    // ── 5. DB assertions ─────────────────────────────────────────
    // RFQ now 'awarded' with awarded_bid_id pinned.
    const rfqRows = await db.execute<{
      status: string;
      awarded_bid_id: string | null;
    }>(
      sql`SELECT status, awarded_bid_id FROM rfqs WHERE id = ${RFQ_ID}`,
    );
    const rfqArr = Array.isArray(rfqRows)
      ? rfqRows
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((rfqRows as any).rows ?? []);
    expect(rfqArr[0].status).toBe('awarded');
    expect(rfqArr[0].awarded_bid_id).toBe(winnerBidId);

    // contracts row inserted referencing the winning bid.
    const contractRows = await db.execute<{ c: number }>(
      sql`SELECT count(*)::int AS c FROM contracts
          WHERE rfq_id = ${RFQ_ID} AND winning_bid_id = ${winnerBidId}`,
    );
    const contractArr = Array.isArray(contractRows)
      ? contractRows
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((contractRows as any).rows ?? []);
    expect(contractArr[0].c).toBe(1);

    // Outbox: winner + 1 loser (inicis) = 2 award emails.
    const outboxRows = await db.execute<{ c: number }>(
      sql`SELECT count(*)::int AS c FROM outbox_entries
          WHERE event_type LIKE 'rfq.awarded%'
            AND payload->>'rfqId' = ${RFQ_ID}`,
    );
    const outboxArr = Array.isArray(outboxRows)
      ? outboxRows
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((outboxRows as any).rows ?? []);
    expect(outboxArr[0].c).toBeGreaterThanOrEqual(2);

    // Notifications fired for winner + loser PG workspaces (in-app drawer).
    const notifRows = await db.execute<{ c: number }>(
      sql`SELECT count(*)::int AS c FROM notifications
          WHERE event_type LIKE 'rfq.awarded%'
            AND payload->>'rfqId' = ${RFQ_ID}`,
    );
    const notifArr = Array.isArray(notifRows)
      ? notifRows
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((notifRows as any).rows ?? []);
    expect(notifArr[0].c).toBeGreaterThanOrEqual(2);
  });
});

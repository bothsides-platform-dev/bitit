/**
 * PG_RFQ_SPEC.md §6 시나리오 B — PG 견적 응답.
 *
 * Toss PG admin claims a pending invitation and submits a bid. Verifies:
 *   - bids row inserted (status='submitted', pgWsId=tossWs)
 *   - notifications row for buyer (bid.submitted)
 *   - outbox_entries row event_type='bid.submitted'
 *   - UI: lands on /inbox/<rfqId>/submitted
 *
 * Token strategy
 * --------------
 * Seed stores only token *hashes* (sha256). To exercise the public
 * `/invite/rfq/:token` claim flow we mint a fresh raw token for the
 * existing pending kakao invitation on `Q-2604-0001`, persist its hash,
 * and use the raw token in the URL. We then log in as toss admin
 * (the seeded `ws-toss-admin@toss.im`) — `claimToken` resolves the
 * invitation to that PG workspace via email-domain auto-join and routes
 * to /inbox/Q-2604-0001 unchanged.
 *
 * Note: scenario A's seeded RFQ `Q-2604-0001` already has 2 submitted
 * bids (toss + inicis from seed) — but those reference fixed pgWsIds
 * that match our login. The RFQ has UNIQUE (rfqId, pgWsId) on bids, so
 * the form will reject our submission. We side-step by clearing the
 * existing toss bid before navigating to the inbox.
 */
import { test, expect } from 'playwright/test';
import { sql, eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { rfqInvitations, bids } from '@/lib/db/schema';
import { generateToken, hashToken } from '@/lib/server/token';

process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  'postgres://bidit:bidit@localhost:5433/bidit_test';

const TOSS_EMAIL = 'ws-toss-admin@toss.im';
const TOSS_PASSWORD = 'password123';
const RFQ_ID = 'Q-2604-0001';

test.describe.serial('Scenario B — PG submits a bid', () => {
  test('toss claims invitation, submits bid, lands on submitted page', async ({
    page,
  }) => {
    // ── Pre: clear toss's seeded bid so submission is permitted. ──
    // (Constraint: unique on (rfq_id, pg_ws_id).)
    await db
      .delete(bids)
      .where(
        and(
          eq(bids.rfqId, RFQ_ID),
          // toss workspace by domain — seeded earlier; we look it up.
          sql`pg_ws_id = (SELECT id FROM workspaces WHERE domain = 'toss.im' LIMIT 1)`,
        ),
      );

    // ── Pre: rotate toss invitation token to a known plaintext. ───
    const rawToken = generateToken();
    await db
      .update(rfqInvitations)
      .set({
        tokenHash: hashToken(rawToken),
        status: 'pending',
        acceptedByUserId: null,
        pgWsId: null,
      })
      .where(
        and(
          eq(rfqInvitations.rfqId, RFQ_ID),
          eq(rfqInvitations.pgEmail, TOSS_EMAIL),
        ),
      );

    // ── 1. Visit invite URL while logged out ─────────────────────
    await page.goto(`/invite/rfq/${rawToken}`);

    // ── 2. Login (proxy redirected us; complete the auth round-trip) ──
    // The invitation flow may redirect through /login?next=… or
    // straight into a signup flow if the user doesn't exist. The seed
    // pre-creates the toss admin so login is the path.
    await page.waitForURL(/\/login|\/invite\/rfq/, { timeout: 10_000 });
    if (page.url().includes('/login')) {
      await page.fill('input[name="email"]', TOSS_EMAIL);
      await page.fill('input[name="password"]', TOSS_PASSWORD);
      await page.getByRole('button', { name: '로그인' }).click();
    }

    // ── 3. Land on /inbox/<rfqId> ────────────────────────────────
    await page.waitForURL(new RegExp(`/inbox/${RFQ_ID}$`), {
      timeout: 15_000,
    });

    // ── 4. Fill the BidForm ──────────────────────────────────────
    // sme2 grade ⇒ card fees by issuer are STATUTORY and the form
    // disables the 9-card panel. We just fill the negotiable fields.
    // Selects use native <select>; numeric inputs are font-mono.
    await page.locator('select').first().selectOption('D+1');

    // Numeric placeholders are unique enough to target. Order in form
    // is: deposit, setupFee, monthlyMin, bankPct(1.50), easyPayPct(1.80),
    // overseasPct(3.00).
    await page.getByPlaceholder('1.50').first().fill('0.50');
    await page.getByPlaceholder('1.80').first().fill('2.50');

    await page
      .getByPlaceholder(/추가 안내 사항이 있으면/)
      .fill('e2e B: D+1, bank 0.5%, easy 2.5%');

    // ── 5. Submit ────────────────────────────────────────────────
    await page.getByRole('button', { name: /견적 제출/ }).click();
    await page.waitForURL(new RegExp(`/inbox/${RFQ_ID}/submitted$`), {
      timeout: 15_000,
    });

    // ── 6. DB assertions ─────────────────────────────────────────
    const bidRows = await db.execute<{ c: number }>(
      sql`SELECT count(*)::int AS c FROM bids
          WHERE rfq_id = ${RFQ_ID}
            AND pg_ws_id = (SELECT id FROM workspaces WHERE domain = 'toss.im' LIMIT 1)
            AND status = 'submitted'`,
    );
    const bidArr = Array.isArray(bidRows)
      ? bidRows
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((bidRows as any).rows ?? []);
    expect(bidArr[0].c).toBe(1);

    // Buyer notification fired (bid.submitted → buyer workspace).
    const notifRows = await db.execute<{ c: number }>(
      sql`SELECT count(*)::int AS c FROM notifications
          WHERE event_type = 'bid.submitted'
            AND payload->>'rfqId' = ${RFQ_ID}`,
    );
    const notifArr = Array.isArray(notifRows)
      ? notifRows
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((notifRows as any).rows ?? []);
    expect(notifArr[0].c).toBeGreaterThanOrEqual(1);

    // Outbox enqueued the bid.submitted email to buyer admin.
    const outboxRows = await db.execute<{ c: number }>(
      sql`SELECT count(*)::int AS c FROM outbox_entries
          WHERE event_type = 'bid.submitted'
            AND payload->>'rfqId' = ${RFQ_ID}`,
    );
    const outboxArr = Array.isArray(outboxRows)
      ? outboxRows
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((outboxRows as any).rows ?? []);
    expect(outboxArr[0].c).toBeGreaterThanOrEqual(1);

    // UI confirmation copy.
    await expect(page.getByText(/제출.*완료|견적이 제출/)).toBeVisible();
  });
});

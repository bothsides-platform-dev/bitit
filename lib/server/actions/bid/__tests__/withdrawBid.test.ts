// withdrawBidAction tests (Step 8).
//
// Coverage:
//   - 같은 ws 가드: 다른 ws bid 철회 차단
//   - canAccess 가드: 도메인 동료 차단 (advisor pin 2)
//   - 멱등성: 이미 withdrawn 인 bid 재호출 ok
//   - withdrawn 후 같은 (rfqId, pgWsId)로 다시 submit → BID_ALREADY_SUBMITTED
//     (advisor pin 4: v0 단순화)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';

import {
  bids,
  rfqs,
  rfqInvitations,
} from '@/lib/db/schema';
import {
  seedBizProfile,
  seedBuyerWorkspace,
  seedMembership,
  seedPgWorkspace,
  seedUser,
} from '@/lib/server/repositories/drizzle/__tests__/_seed';
import { generateToken, hashToken, addMinutes } from '@/lib/server/token';
import { setupRfqActionEnv, teardownRfqActionEnv } from '../../rfq/__tests__/_setup';
import type { PgliteDB } from '@/lib/db/client-pglite';

const sessionRef: {
  value: {
    user: {
      id: string;
      email: string;
      name?: string;
      workspaceId: string;
      workspaceType: 'pg';
      role: 'admin' | 'member';
    };
  } | null;
} = { value: null };

vi.mock('@/lib/auth/session', () => ({
  requireSession: () => {
    if (!sessionRef.value) return Promise.reject(new Error('UNAUTHENTICATED'));
    return Promise.resolve(sessionRef.value);
  },
  requirePgSession: () => {
    if (!sessionRef.value) return Promise.reject(new Error('FORBIDDEN_PG'));
    return Promise.resolve(sessionRef.value);
  },
  requireBuyerSession: () => {
    if (!sessionRef.value) return Promise.reject(new Error('FORBIDDEN_BUYER'));
    return Promise.resolve(sessionRef.value);
  },
}));

import { withdrawBidAction } from '../withdrawBidAction';
import { submitBidAction } from '../submitBidAction';

let db: PgliteDB;

async function setup() {
  const buyer = await seedUser(db, { email: 'b@buyer.com' });
  const biz = await seedBizProfile(db);
  const buyerWs = await seedBuyerWorkspace(db, { bizProfileId: biz.id });
  await seedMembership(db, buyerWs.id, buyer.id, 'admin');

  const pgWs = await seedPgWorkspace(db, 'toss.im');
  const pgUser = await seedUser(db, { email: 'sales@toss.im' });
  await seedMembership(db, pgWs.id, pgUser.id, 'admin');

  const rfqId = 'Q-2605-0001';
  await db.insert(rfqs).values({
    id: rfqId,
    buyerWsId: buyerWs.id,
    bizProfileId: biz.id,
    title: 'withdraw test',
    memo: '',
    allowedPgEmails: ['sales@toss.im'],
    deadline: new Date(Date.now() + 86_400_000),
    status: 'sent',
    createdBy: buyer.id,
    sentAt: new Date(),
  });

  const invId = randomUUID();
  await db.insert(rfqInvitations).values({
    id: invId,
    rfqId,
    pgEmail: 'sales@toss.im',
    pgWsId: pgWs.id,
    acceptedByUserId: pgUser.id,
    tokenHash: hashToken(generateToken()),
    sentAt: new Date(),
    expiresAt: new Date(addMinutes(new Date(), 7 * 24 * 60)),
    status: 'accepted',
  });

  return { rfqId, buyerWsId: buyerWs.id, pgWsId: pgWs.id, pgUser, invId };
}

const submitInput = {
  settleCycle: 'D+1' as const,
  deposit: 0,
  setupFee: 0,
  monthlyMin: 0,
  bankTransferFeePct: 0.001,
  easyPayFeePct: 0.018,
};

describe('withdrawBidAction', () => {
  beforeEach(async () => {
    db = await setupRfqActionEnv();
  });
  afterEach(() => {
    teardownRfqActionEnv();
    sessionRef.value = null;
  });

  it('rejects without PG session', async () => {
    sessionRef.value = null;
    const r = await withdrawBidAction({ bidId: randomUUID() });
    expect(r.ok).toBe(false);
  });

  it('rejects unknown bid', async () => {
    const s = await setup();
    sessionRef.value = {
      user: {
        id: s.pgUser.id,
        email: s.pgUser.email,
        workspaceId: s.pgWsId,
        workspaceType: 'pg',
        role: 'admin',
      },
    };
    const r = await withdrawBidAction({ bidId: randomUUID() });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('BID_NOT_FOUND');
  });

  it('happy path: submitted → withdrawn', async () => {
    const s = await setup();
    sessionRef.value = {
      user: {
        id: s.pgUser.id,
        email: s.pgUser.email,
        workspaceId: s.pgWsId,
        workspaceType: 'pg',
        role: 'admin',
      },
    };

    const r1 = await submitBidAction({ rfqId: s.rfqId, ...submitInput });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    const r2 = await withdrawBidAction({ bidId: r1.bidId });
    expect(r2.ok).toBe(true);

    const [row] = await db.select().from(bids).where(eq(bids.id, r1.bidId));
    expect(row.status).toBe('withdrawn');
  });

  it('idempotent — withdrawing an already-withdrawn bid is ok', async () => {
    const s = await setup();
    sessionRef.value = {
      user: {
        id: s.pgUser.id,
        email: s.pgUser.email,
        workspaceId: s.pgWsId,
        workspaceType: 'pg',
        role: 'admin',
      },
    };
    const r1 = await submitBidAction({ rfqId: s.rfqId, ...submitInput });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const r2 = await withdrawBidAction({ bidId: r1.bidId });
    expect(r2.ok).toBe(true);
    const r3 = await withdrawBidAction({ bidId: r1.bidId });
    expect(r3.ok).toBe(true);
  });

  it('🚨 same-domain peer cannot withdraw — canAccess gate', async () => {
    const s = await setup();
    sessionRef.value = {
      user: {
        id: s.pgUser.id,
        email: s.pgUser.email,
        workspaceId: s.pgWsId,
        workspaceType: 'pg',
        role: 'admin',
      },
    };
    const r1 = await submitBidAction({ rfqId: s.rfqId, ...submitInput });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    // Peer @toss.im member — joined the ws but never claimed the RFQ invitation.
    const peer = await seedUser(db, { email: 'cs@toss.im' });
    await seedMembership(db, s.pgWsId, peer.id);
    sessionRef.value = {
      user: {
        id: peer.id,
        email: 'cs@toss.im',
        workspaceId: s.pgWsId,
        workspaceType: 'pg',
        role: 'member',
      },
    };

    const r2 = await withdrawBidAction({ bidId: r1.bidId });
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error).toBe('FORBIDDEN');

    // bid still submitted.
    const [row] = await db.select().from(bids).where(eq(bids.id, r1.bidId));
    expect(row.status).toBe('submitted');
  });

  it('after withdraw, re-submit same (rfqId, pgWsId) returns BID_ALREADY_SUBMITTED (v0 simplification, advisor pin 4)', async () => {
    const s = await setup();
    sessionRef.value = {
      user: {
        id: s.pgUser.id,
        email: s.pgUser.email,
        workspaceId: s.pgWsId,
        workspaceType: 'pg',
        role: 'admin',
      },
    };
    const r1 = await submitBidAction({ rfqId: s.rfqId, ...submitInput });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    await withdrawBidAction({ bidId: r1.bidId });

    const r2 = await submitBidAction({ rfqId: s.rfqId, ...submitInput });
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error).toBe('BID_ALREADY_SUBMITTED');
  });
});

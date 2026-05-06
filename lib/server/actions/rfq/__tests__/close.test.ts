import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';

import {
  bids,
  notifications,
  rfqInvitations,
  rfqs,
} from '@/lib/db/schema';
import {
  seedBizProfile,
  seedBuyerWorkspace,
  seedMembership,
  seedPgWorkspace,
  seedUser,
} from '@/lib/server/repositories/drizzle/__tests__/_seed';
import { setupRfqActionEnv, teardownRfqActionEnv } from './_setup';
import type { PgliteDB } from '@/lib/db/client-pglite';

const sessionRef: {
  value: {
    user: {
      id: string;
      email: string;
      workspaceId: string;
      workspaceType: 'buyer';
      role: 'admin' | 'member';
    };
  } | null;
} = { value: null };

vi.mock('@/lib/auth/session', () => ({
  requireSession: () => Promise.reject(new Error('unused')),
  requireBuyerSession: () => {
    if (!sessionRef.value) return Promise.reject(new Error('FORBIDDEN_BUYER'));
    return Promise.resolve(sessionRef.value);
  },
}));

import { closeRfqAction } from '../closeRfqAction';

let db: PgliteDB;

describe('closeRfqAction', () => {
  beforeEach(async () => {
    db = await setupRfqActionEnv();
  });
  afterEach(() => {
    teardownRfqActionEnv();
    sessionRef.value = null;
  });

  it('flips status to closed + in-app notification only', async () => {
    const buyer = await seedUser(db, { email: 'b@x.com' });
    const biz = await seedBizProfile(db);
    const buyerWs = await seedBuyerWorkspace(db, { bizProfileId: biz.id });
    await seedMembership(db, buyerWs.id, buyer.id, 'admin');
    const pgWs = await seedPgWorkspace(db, 'toss.im');
    const pgUser = await seedUser(db, { email: 'pg@toss.im' });
    await seedMembership(db, pgWs.id, pgUser.id);
    const rfqId = 'Q-2605-0020';
    await db.insert(rfqs).values({
      id: rfqId,
      buyerWsId: buyerWs.id,
      bizProfileId: biz.id,
      title: 'close test',
      memo: '',
      allowedPgEmails: ['pg@toss.im'],
      deadline: new Date(Date.now() + 86_400_000),
      status: 'sent',
      createdBy: buyer.id,
      sentAt: new Date(),
    });
    const invId = randomUUID();
    await db.insert(rfqInvitations).values({
      id: invId,
      rfqId,
      pgEmail: 'pg@toss.im',
      pgWsId: pgWs.id,
      tokenHash: randomUUID(),
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 86_400_000),
      status: 'accepted',
    });
    await db.insert(bids).values({
      id: randomUUID(),
      rfqId,
      pgWsId: pgWs.id,
      invitationId: invId,
      settleCycle: 'D+1',
      deposit: '0',
      setupFee: '0',
      monthlyMin: '0',
      bankTransferFeePct: '0',
      easyPayFeePct: '0',
      status: 'submitted',
      submittedBy: pgUser.id,
      submittedAt: new Date(),
    });

    sessionRef.value = {
      user: {
        id: buyer.id,
        email: 'b@x.com',
        workspaceId: buyerWs.id,
        workspaceType: 'buyer',
        role: 'admin',
      },
    };
    const r = await closeRfqAction({ rfqId });
    expect(r.ok).toBe(true);

    const [row] = await db.select().from(rfqs).where(eq(rfqs.id, rfqId));
    expect(row.status).toBe('closed');

    const ns = await db
      .select()
      .from(notifications)
      .where(eq(notifications.type, 'rfq.closed'));
    expect(ns).toHaveLength(1);
    expect(ns[0].userId).toBe(pgUser.id);
    expect(ns[0].channel).toBe('in_app');
  });

  it('rejects ownership mismatch', async () => {
    const buyer = await seedUser(db, { email: 'b@x.com' });
    const biz = await seedBizProfile(db);
    const buyerWs = await seedBuyerWorkspace(db, { bizProfileId: biz.id });
    await seedMembership(db, buyerWs.id, buyer.id, 'admin');
    const rfqId = 'Q-2605-0021';
    await db.insert(rfqs).values({
      id: rfqId,
      buyerWsId: buyerWs.id,
      bizProfileId: biz.id,
      title: 'x',
      memo: '',
      allowedPgEmails: ['pg@toss.im'],
      deadline: new Date(Date.now() + 86_400_000),
      status: 'sent',
      createdBy: buyer.id,
      sentAt: new Date(),
    });
    sessionRef.value = {
      user: {
        id: buyer.id,
        email: 'b@x.com',
        workspaceId: randomUUID(),
        workspaceType: 'buyer',
        role: 'admin',
      },
    };
    const r = await closeRfqAction({ rfqId });
    expect(r.ok).toBe(false);
  });
});

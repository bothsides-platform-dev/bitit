import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { bids, rfqInvitations, rfqs } from '@/lib/db/schema';
import {
  seedBuyerWorkspace,
  seedPgWorkspace,
  seedUser,
  seedMembership,
} from '@/lib/server/repositories/drizzle/__tests__/_seed';
import {
  setupRfqActionEnv,
  teardownRfqActionEnv,
} from '../../rfq/__tests__/_setup';
import type { PgliteDB } from '@/lib/db/client-pglite';

const sessionRef: {
  value: {
    user: {
      id: string;
      workspaceId: string;
      workspaceType: 'buyer' | 'pg';
      role: 'admin';
    };
  } | null;
} = { value: null };

vi.mock('@/lib/auth/session', () => ({
  requireSession: () => {
    if (!sessionRef.value) return Promise.reject(new Error('UNAUTHENTICATED'));
    return Promise.resolve(sessionRef.value);
  },
  requireBuyerSession: () => {
    if (!sessionRef.value) return Promise.reject(new Error('FORBIDDEN_BUYER'));
    return Promise.resolve(sessionRef.value);
  },
  requirePgSession: () => {
    if (!sessionRef.value) return Promise.reject(new Error('FORBIDDEN_PG'));
    return Promise.resolve(sessionRef.value);
  },
}));

import { searchBidsAction } from '../searchBidsAction';

let db: PgliteDB;

beforeEach(async () => {
  db = await setupRfqActionEnv();
  sessionRef.value = null;
});

afterEach(() => {
  teardownRfqActionEnv();
});

async function seedRfq(opts: {
  id: string;
  buyerWsId: string;
  title: string;
  createdBy: string;
}) {
  await db.insert(rfqs).values({
    id: opts.id,
    buyerWsId: opts.buyerWsId,
    title: opts.title,
    memo: '',
    allowedPgWorkspaceIds: [],
    deadline: new Date(Date.now() + 86_400_000),
    status: 'sent',
    createdBy: opts.createdBy,
    sentAt: new Date(),
  });
}

async function seedBid(opts: {
  rfqId: string;
  pgWsId: string;
  invitationId: string;
  submittedBy: string;
  status?: 'draft' | 'submitted' | 'withdrawn';
  memo?: string | null;
}) {
  const bidId = randomUUID();
  await db.insert(bids).values({
    id: bidId,
    rfqId: opts.rfqId,
    pgWsId: opts.pgWsId,
    invitationId: opts.invitationId,
    settleCycle: 'D+1',
    deposit: '0',
    setupFee: '0',
    monthlyMin: '0',
    bankTransferFeePct: '0.500',
    easyPayFeePct: '0.800',
    memo: opts.memo ?? '',
    status: opts.status ?? 'submitted',
    submittedBy: opts.submittedBy,
    submittedAt: new Date(),
  });
  return bidId;
}

async function seedInvitation(opts: {
  rfqId: string;
  pgWsId: string;
}) {
  const id = randomUUID();
  await db.insert(rfqInvitations).values({
    id,
    rfqId: opts.rfqId,
    pgWsId: opts.pgWsId,
    tokenHash: randomUUID(),
    sentAt: new Date(),
    expiresAt: new Date(Date.now() + 86_400_000),
    status: 'accepted',
  });
  return id;
}

describe('searchBidsAction', () => {
  it('비인증 상태에서 빈 배열 반환', async () => {
    sessionRef.value = null;
    const result = await searchBidsAction();
    expect(result).toEqual([]);
  });

  it('buyer: 자신의 RFQ에 달린 submitted 견적서를 PG사명·메모와 함께 반환', async () => {
    const buyer = await seedUser(db, { email: 'buyer@co.com' });
    const buyerWs = await seedBuyerWorkspace(db);
    await seedMembership(db, buyerWs.id, buyer.id, 'admin');

    const pgWs = await seedPgWorkspace(db, 'toss.im', { name: '토스페이먼츠' });
    const pgUser = await seedUser(db, { email: 'pg@toss.im' });
    await seedMembership(db, pgWs.id, pgUser.id, 'admin');

    await seedRfq({ id: 'Q-2605-0001', buyerWsId: buyerWs.id, title: '수수료 문의', createdBy: buyer.id });
    const invId = await seedInvitation({ rfqId: 'Q-2605-0001', pgWsId: pgWs.id });
    await seedBid({ rfqId: 'Q-2605-0001', pgWsId: pgWs.id, invitationId: invId, submittedBy: pgUser.id, memo: '정산 협의 가능' });

    sessionRef.value = { user: { id: buyer.id, workspaceId: buyerWs.id, workspaceType: 'buyer', role: 'admin' } };

    const result = await searchBidsAction();

    expect(result).toHaveLength(1);
    expect(result[0].rfqTitle).toBe('수수료 문의');
    expect(result[0].pgWsName).toBe('토스페이먼츠');
    expect(result[0].memo).toBe('정산 협의 가능');
    expect(result[0].href).toBe('/rfq/Q-2605-0001');
  });

  it('buyer: draft·withdrawn 견적서는 제외', async () => {
    const buyer = await seedUser(db, { email: 'buyer@co.com' });
    const buyerWs = await seedBuyerWorkspace(db);
    await seedMembership(db, buyerWs.id, buyer.id, 'admin');

    const pgWs = await seedPgWorkspace(db, 'toss.im', { name: '토스페이먼츠' });
    const pgUser = await seedUser(db, { email: 'pg@toss.im' });
    await seedMembership(db, pgWs.id, pgUser.id, 'admin');

    await seedRfq({ id: 'Q-2605-0002', buyerWsId: buyerWs.id, title: 'Draft Test', createdBy: buyer.id });
    const invId = await seedInvitation({ rfqId: 'Q-2605-0002', pgWsId: pgWs.id });
    await seedBid({ rfqId: 'Q-2605-0002', pgWsId: pgWs.id, invitationId: invId, submittedBy: pgUser.id, status: 'draft' });

    sessionRef.value = { user: { id: buyer.id, workspaceId: buyerWs.id, workspaceType: 'buyer', role: 'admin' } };

    const result = await searchBidsAction();
    expect(result).toHaveLength(0);
  });

  it('pg: 자신이 제출한 견적서를 /inbox/[rfqId] href와 함께 반환', async () => {
    const buyer = await seedUser(db, { email: 'buyer@co.com' });
    const buyerWs = await seedBuyerWorkspace(db);
    await seedMembership(db, buyerWs.id, buyer.id, 'admin');

    const pgWs = await seedPgWorkspace(db, 'kakao.com', { name: '카카오페이' });
    const pgUser = await seedUser(db, { email: 'sales@kakao.com' });
    await seedMembership(db, pgWs.id, pgUser.id, 'admin');

    await seedRfq({ id: 'Q-2605-0003', buyerWsId: buyerWs.id, title: 'PG Test RFQ', createdBy: buyer.id });
    const invId = await seedInvitation({ rfqId: 'Q-2605-0003', pgWsId: pgWs.id });
    await seedBid({ rfqId: 'Q-2605-0003', pgWsId: pgWs.id, invitationId: invId, submittedBy: pgUser.id });

    sessionRef.value = { user: { id: pgUser.id, workspaceId: pgWs.id, workspaceType: 'pg', role: 'admin' } };

    const result = await searchBidsAction();

    expect(result).toHaveLength(1);
    expect(result[0].rfqTitle).toBe('PG Test RFQ');
    expect(result[0].href).toBe('/inbox/Q-2605-0003');
  });
});

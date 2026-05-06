// claimInviteTokenAction tests (Step 8).
//
// Coverage:
//   - email 매칭 검사 (advisor pin 3): 같은 도메인 동료 토큰 가로채기 차단
//   - 잘못된/만료된/이미 사용된 토큰 분기
//   - 도메인 매칭 PG ws에 자동 join
//   - 매칭 ws가 없으면 새 PG ws + admin 멤버 생성
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';

import {
  rfqs,
  rfqInvitations,
  workspaces,
  workspaceMembers,
} from '@/lib/db/schema';
import {
  seedBizProfile,
  seedBuyerWorkspace,
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
      workspaceId?: string;
      workspaceType?: 'buyer' | 'pg';
      role?: 'admin' | 'member';
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

import { claimInviteTokenAction } from '../claimInviteTokenAction';

let db: PgliteDB;

async function setup() {
  const buyer = await seedUser(db, { email: 'buyer@x.com' });
  const biz = await seedBizProfile(db);
  const buyerWs = await seedBuyerWorkspace(db, { bizProfileId: biz.id });

  const rfqId = 'Q-2605-0001';
  await db.insert(rfqs).values({
    id: rfqId,
    buyerWsId: buyerWs.id,
    bizProfileId: biz.id,
    title: 'invite test',
    memo: '',
    allowedPgEmails: ['sales@toss.im'],
    deadline: new Date(Date.now() + 86_400_000),
    status: 'sent',
    createdBy: buyer.id,
    sentAt: new Date(),
  });

  const rawToken = generateToken();
  const invId = randomUUID();
  await db.insert(rfqInvitations).values({
    id: invId,
    rfqId,
    pgEmail: 'sales@toss.im',
    tokenHash: hashToken(rawToken),
    sentAt: new Date(),
    expiresAt: new Date(addMinutes(new Date(), 7 * 24 * 60)),
    status: 'pending',
  });

  return { rfqId, invId, rawToken, buyerWsId: buyerWs.id };
}

describe('claimInviteTokenAction', () => {
  beforeEach(async () => {
    db = await setupRfqActionEnv();
  });
  afterEach(() => {
    teardownRfqActionEnv();
    sessionRef.value = null;
  });

  it('rejects when unauthenticated', async () => {
    const ctx = await setup();
    sessionRef.value = null;
    const r = await claimInviteTokenAction(ctx.rawToken);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('UNAUTHENTICATED');
  });

  it('returns INVITE_INVALID for unknown token', async () => {
    await setup();
    const peer = await seedUser(db, { email: 'peer@toss.im' });
    sessionRef.value = { user: { id: peer.id, email: peer.email } };
    const r = await claimInviteTokenAction('not-a-real-token-xxx');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('INVITE_INVALID');
  });

  it('🚨 rejects same-domain peer with INVITE_EMAIL_MISMATCH (advisor pin 3)', async () => {
    const ctx = await setup();
    // sales@toss.im 으로 발송된 초대를 cs@toss.im 동료가 가로채려는 시도.
    const peer = await seedUser(db, { email: 'cs@toss.im' });
    sessionRef.value = { user: { id: peer.id, email: peer.email } };

    const r = await claimInviteTokenAction(ctx.rawToken);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('INVITE_EMAIL_MISMATCH');

    // 토큰은 여전히 unclaim — 가로챘다고 atomic claim은 일어나지 않음.
    const [row] = await db
      .select()
      .from(rfqInvitations)
      .where(eq(rfqInvitations.id, ctx.invId));
    expect(row.acceptedByUserId).toBeNull();
  });

  it('case-insensitive email match — sales@TOSS.IM matches sales@toss.im', async () => {
    const ctx = await setup();
    const u = await seedUser(db, { email: 'SALES@toss.im' });
    sessionRef.value = { user: { id: u.id, email: 'SALES@toss.im' } };

    const r = await claimInviteTokenAction(ctx.rawToken);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.rfqId).toBe(ctx.rfqId);
  });

  it('successful claim auto-joins existing PG ws by domain', async () => {
    const ctx = await setup();
    const tossWs = await seedPgWorkspace(db, 'toss.im', { name: '토스페이먼츠' });
    const u = await seedUser(db, { email: 'sales@toss.im' });
    sessionRef.value = { user: { id: u.id, email: u.email } };

    const r = await claimInviteTokenAction(ctx.rawToken);
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    // membership row exists for tossWs.
    const [m] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, tossWs.id),
          eq(workspaceMembers.userId, u.id),
        ),
      );
    expect(m).toBeDefined();

    // No new pg ws was created.
    const allTossWs = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.domain, 'toss.im'));
    expect(allTossWs).toHaveLength(1);
  });

  it('successful claim creates new PG ws when domain has no ws', async () => {
    const ctx = await setup();
    const u = await seedUser(db, { email: 'sales@toss.im' });
    sessionRef.value = { user: { id: u.id, email: u.email } };

    const r = await claimInviteTokenAction(ctx.rawToken);
    expect(r.ok).toBe(true);

    const [ws] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.domain, 'toss.im'));
    expect(ws).toBeDefined();
    expect(ws.type).toBe('pg');
    expect(ws.name).toBe('toss.im');

    const [m] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, ws.id),
          eq(workspaceMembers.userId, u.id),
        ),
      );
    expect(m).toBeDefined();
    expect(m.role).toBe('admin');
  });

  it('second claim of same token returns INVITE_USED', async () => {
    const ctx = await setup();
    const u = await seedUser(db, { email: 'sales@toss.im' });
    sessionRef.value = { user: { id: u.id, email: u.email } };

    const r1 = await claimInviteTokenAction(ctx.rawToken);
    expect(r1.ok).toBe(true);

    // Same user re-claim — atomic claimToken returns 'used' since
    // acceptedByUserId is no longer null.
    const r2 = await claimInviteTokenAction(ctx.rawToken);
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error).toBe('INVITE_USED');
  });

  it('expired token returns INVITE_EXPIRED', async () => {
    const buyer = await seedUser(db, { email: 'buyer-2@x.com' });
    const biz = await seedBizProfile(db, { bizNo: '9876543210' });
    const buyerWs = await seedBuyerWorkspace(db, { bizProfileId: biz.id });

    const rfqId = 'Q-2605-0099';
    await db.insert(rfqs).values({
      id: rfqId,
      buyerWsId: buyerWs.id,
      bizProfileId: biz.id,
      title: 'expired invite test',
      memo: '',
      allowedPgEmails: ['sales@toss.im'],
      deadline: new Date(Date.now() + 86_400_000),
      status: 'sent',
      createdBy: buyer.id,
    });

    const rawToken = generateToken();
    await db.insert(rfqInvitations).values({
      id: randomUUID(),
      rfqId,
      pgEmail: 'sales@toss.im',
      tokenHash: hashToken(rawToken),
      sentAt: new Date(Date.now() - 8 * 86_400_000),
      // 1초 전 — 만료.
      expiresAt: new Date(Date.now() - 1000),
      status: 'pending',
    });

    const u = await seedUser(db, { email: 'sales@toss.im' });
    sessionRef.value = { user: { id: u.id, email: u.email } };

    const r = await claimInviteTokenAction(rawToken);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('INVITE_EXPIRED');
  });
});

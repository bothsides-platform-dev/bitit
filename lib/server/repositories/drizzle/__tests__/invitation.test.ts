import { describe, expect, it, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createPgliteDb } from '@/lib/db/client-pglite';
import { rfqs } from '@/lib/db/schema';
import { DrizzleInvitationRepository } from '../invitation';
import { generateToken, addMinutes, hashToken } from '../../../token';
import type { RfqInvitation } from '@/lib/types/invitation';
import {
  seedBizProfile,
  seedBuyerWorkspace,
  seedUser,
} from './_seed';

async function setup() {
  const db = await createPgliteDb();
  const buyer = await seedUser(db);
  const biz = await seedBizProfile(db);
  const ws = await seedBuyerWorkspace(db, { bizProfileId: biz.id });
  // Insert one RFQ to FK against.
  const rfqId = 'Q-2605-0001';
  await db.insert(rfqs).values({
    id: rfqId,
    buyerWsId: ws.id,
    bizProfileId: biz.id,
    title: 'T',
    memo: '',
    allowedPgEmails: [],
    deadline: new Date(Date.now() + 86_400_000),
    status: 'sent',
    createdBy: buyer.id,
  });
  const repo = new DrizzleInvitationRepository(db);
  return { db, repo, buyer, ws, rfqId };
}

function makeInvitation(rfqId: string, overrides?: Partial<RfqInvitation>): RfqInvitation {
  return {
    id: randomUUID(),
    rfqId,
    pgEmail: 'sales@toss.im',
    uniqueToken: 'placeholder',
    sentAt: new Date().toISOString(),
    expiresAt: addMinutes(new Date(), 7 * 24 * 60),
    status: 'sent',
    ...overrides,
  };
}

describe('DrizzleInvitationRepository', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  let repo: DrizzleInvitationRepository;

  beforeEach(async () => {
    ctx = await setup();
    repo = ctx.repo;
  });

  it('claims a valid token and sets acceptedByUserId', async () => {
    const raw = generateToken();
    await repo.save(makeInvitation(ctx.rfqId), raw);
    const claimer = await seedUser(ctx.db, { email: 'pg-1@toss.im' });

    const result = await repo.claimToken(raw, claimer.id);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.invitation.acceptedByUserId).toBe(claimer.id);
      expect(result.invitation.status).toBe('accepted');
    }
  });

  it('returns invalid for unknown token', async () => {
    const claimer = await seedUser(ctx.db);
    const result = await repo.claimToken('unknown-' + Date.now(), claimer.id);
    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('returns expired for past expiresAt', async () => {
    const raw = generateToken();
    await repo.save(
      makeInvitation(ctx.rfqId, { expiresAt: new Date(Date.now() - 1000).toISOString() }),
      raw,
    );
    const claimer = await seedUser(ctx.db);
    expect(await repo.claimToken(raw, claimer.id)).toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('second claim returns used', async () => {
    const raw = generateToken();
    await repo.save(makeInvitation(ctx.rfqId), raw);
    const a = await seedUser(ctx.db, { email: 'a@toss.im' });
    const b = await seedUser(ctx.db, { email: 'b@toss.im' });
    await repo.claimToken(raw, a.id);
    expect(await repo.claimToken(raw, b.id)).toEqual({ ok: false, reason: 'used' });
  });

  it('canAccess is true only for the accepting user (same-domain peers blocked)', async () => {
    const raw = generateToken();
    await repo.save(makeInvitation(ctx.rfqId), raw);
    const accepter = await seedUser(ctx.db, { email: 'sales@toss.im' });
    const peer = await seedUser(ctx.db, { email: 'cs@toss.im' }); // same domain, NOT the accepter
    await repo.claimToken(raw, accepter.id);

    expect(await repo.canAccess(ctx.rfqId, accepter.id)).toBe(true);
    // Critical invariant: same-domain peer who never claimed must be blocked.
    expect(await repo.canAccess(ctx.rfqId, peer.id)).toBe(false);
  });

  it('parallel claimToken: one wins, the other returns used (atomic UPDATE WHERE)', async () => {
    const raw = generateToken();
    await repo.save(makeInvitation(ctx.rfqId), raw);
    const a = await seedUser(ctx.db, { email: 'a@toss.im' });
    const b = await seedUser(ctx.db, { email: 'b@toss.im' });

    const settled = await Promise.allSettled([
      repo.claimToken(raw, a.id),
      repo.claimToken(raw, b.id),
    ]);
    const results = settled
      .filter(
        (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof repo.claimToken>>> =>
          r.status === 'fulfilled',
      )
      .map((r) => r.value);
    const oks = results.filter((r) => r.ok);
    const useds = results.filter((r) => !r.ok && r.reason === 'used');
    expect(oks).toHaveLength(1);
    expect(useds).toHaveLength(1);
  });

  it('findByRfq returns invitations for the RFQ', async () => {
    const r1 = generateToken();
    const r2 = generateToken();
    await repo.save(makeInvitation(ctx.rfqId, { pgEmail: 'a@x.com' }), r1);
    await repo.save(makeInvitation(ctx.rfqId, { pgEmail: 'b@x.com' }), r2);
    const list = await repo.findByRfq(ctx.rfqId);
    expect(list).toHaveLength(2);
  });

  it('findByTokenHash hits the row before claim — pgEmail readable', async () => {
    const raw = generateToken();
    const inv = makeInvitation(ctx.rfqId, { pgEmail: 'sales@toss.im' });
    await repo.save(inv, raw);

    const found = await repo.findByTokenHash(hashToken(raw));
    expect(found).toBeDefined();
    expect(found!.id).toBe(inv.id);
    expect(found!.pgEmail).toBe('sales@toss.im');
    expect(found!.acceptedByUserId).toBeUndefined();

    // Unknown hash → undefined.
    const missing = await repo.findByTokenHash(hashToken('nope-' + Date.now()));
    expect(missing).toBeUndefined();
  });

  it('findByPgUser returns claimed invitation+RFQ pairs only for that user', async () => {
    const r1 = generateToken();
    const r2 = generateToken();
    await repo.save(makeInvitation(ctx.rfqId, { pgEmail: 'a@toss.im' }), r1);
    await repo.save(makeInvitation(ctx.rfqId, { pgEmail: 'b@toss.im' }), r2);

    const userA = await seedUser(ctx.db, { email: 'a@toss.im' });
    const userB = await seedUser(ctx.db, { email: 'b@toss.im' });

    // userA claims their token; userB never claims.
    await repo.claimToken(r1, userA.id);

    const aPairs = await repo.findByPgUser(userA.id);
    expect(aPairs).toHaveLength(1);
    expect(aPairs[0].rfq.id).toBe(ctx.rfqId);
    expect(aPairs[0].invitation.acceptedByUserId).toBe(userA.id);

    const bPairs = await repo.findByPgUser(userB.id);
    expect(bPairs).toHaveLength(0);
  });
});

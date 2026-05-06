// End-to-end (action-only) walk through the four signup hops:
//   P2 signupEmailAction → P4 verifyEmailAction → P5/P6 signupCompleteAction
//
// No UI involved. The point is to prove the sessionStorage hand-off the
// client performs (email, inviteToken) carries the right data so each hop
// has what it needs.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import {
  outboxEntries,
  rfqInvitations,
  rfqs,
  users,
  workspaces,
} from '@/lib/db/schema';
import { signupEmailAction } from '../../signupEmailAction';
import { verifyEmailAction } from '../../verifyEmailAction';
import { signupCompleteAction } from '../../signupCompleteAction';
import { setupActionEnv, teardownActionEnv } from '../_setup';
import {
  seedBizProfile,
  seedBuyerWorkspace,
  seedUser,
} from '@/lib/server/repositories/drizzle/__tests__/_seed';
import { addMinutes, generateToken, hashToken } from '@/lib/server/token';
import type { PgliteDB } from '@/lib/db/client-pglite';

let db: PgliteDB;

function tokenFromOutbox(html: string): string {
  return decodeURIComponent(html.match(/token=([^"]+)"/)?.[1] ?? '');
}

describe('signup flow integration (no UI)', () => {
  beforeEach(async () => {
    db = await setupActionEnv();
  });
  afterEach(teardownActionEnv);

  it('P2 → P4 → P5 (buyer) lands rows in users, workspaces, biz_profiles', async () => {
    // P2 — buyer requests verify mail
    const e = await signupEmailAction({ email: 'kim@example.com' });
    expect(e.ok).toBe(true);

    // Pull the raw token from the outbox HTML body (Step 5 fallback).
    const rows = await db
      .select({ html: outboxEntries.html })
      .from(outboxEntries)
      .where(eq(outboxEntries.event, 'auth.verify'))
      .limit(1);
    const rawToken = tokenFromOutbox(rows[0].html);

    // P4 — verify token (atomic consume)
    const v = await verifyEmailAction(rawToken);
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    expect(v.email).toBe('kim@example.com');

    // P5/P6 — finalise signup as buyer
    const c = await signupCompleteAction({
      email: v.email,
      name: '김구매',
      password: 'Password123!',
      wsKind: 'buyer',
      wsName: '(주)샘플테크',
      bizProfile: {
        bizNo: '1234567890',
        taxType: 'general',
        status: 'active',
        grade: 'general',
        gradeSource: 'user_confirmed',
      },
    });
    expect(c.ok).toBe(true);
    if (!c.ok) return;
    expect(c.redirectTo).toBe('/rfq');

    // Sanity on the persisted graph.
    const [u] = await db.select().from(users).where(eq(users.email, 'kim@example.com'));
    expect(u).toBeDefined();
    const [ws] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.name, '(주)샘플테크'));
    expect(ws.bizProfileId).not.toBeNull();
  });

  it('P2 → P4 → P5 with inviteToken auto-joins/creates a PG ws and redirects to /inbox/{rfqId}', async () => {
    // Seed a buyer-side RFQ + invitation row that the new PG user will claim.
    const buyer = await seedUser(db, { email: 'buyer@biz.com' });
    const biz = await seedBizProfile(db);
    const buyerWs = await seedBuyerWorkspace(db, { bizProfileId: biz.id });
    const rfqId = 'Q-2605-9901';
    await db.insert(rfqs).values({
      id: rfqId,
      buyerWsId: buyerWs.id,
      bizProfileId: biz.id,
      title: 'Test RFQ',
      memo: '',
      allowedPgEmails: ['sales@toss.im'],
      deadline: new Date(Date.now() + 86_400_000),
      status: 'sent',
      createdBy: buyer.id,
    });
    const inviteRaw = generateToken();
    await db.insert(rfqInvitations).values({
      id: crypto.randomUUID(),
      rfqId,
      pgEmail: 'sales@toss.im',
      tokenHash: hashToken(inviteRaw),
      sentAt: new Date(),
      expiresAt: new Date(addMinutes(new Date(), 7 * 24 * 60)),
      status: 'pending',
    });

    // P2 — sign up with the invite token attached to meta
    const e = await signupEmailAction({
      email: 'sales@toss.im',
      inviteToken: inviteRaw,
    });
    expect(e.ok).toBe(true);

    const rows = await db
      .select({ html: outboxEntries.html })
      .from(outboxEntries)
      .where(eq(outboxEntries.toAddr, 'sales@toss.im'))
      .limit(1);
    const verifyToken = tokenFromOutbox(rows[0].html);

    // P4 — verify carries the invite token back to the client
    const v = await verifyEmailAction(verifyToken);
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    expect(v.inviteToken).toBe(inviteRaw);

    // P5/P6 — finalise with inviteToken; buyer/PG branch logic is skipped.
    const c = await signupCompleteAction({
      email: v.email,
      name: '토스영업',
      password: 'Password123!',
      inviteToken: v.inviteToken,
    });
    expect(c.ok).toBe(true);
    if (!c.ok) return;
    expect(c.redirectTo).toBe(`/inbox/${rfqId}`);

    // PG workspace was auto-created from the email domain.
    const [pgWs] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.domain, 'toss.im'));
    expect(pgWs).toBeDefined();
    expect(pgWs.type).toBe('pg');

    // Invitation has acceptedByUserId + pgWsId stamped.
    const [inv] = await db
      .select()
      .from(rfqInvitations)
      .where(eq(rfqInvitations.tokenHash, hashToken(inviteRaw)));
    expect(inv.status).toBe('accepted');
    expect(inv.acceptedByUserId).not.toBeNull();
    expect(inv.pgWsId).toBe(pgWs.id);
  });
});

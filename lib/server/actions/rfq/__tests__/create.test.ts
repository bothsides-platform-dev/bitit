import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq, and } from 'drizzle-orm';

import { randomUUID } from 'node:crypto';
import {
  attachments,
  bizProfiles,
  outboxEntries,
  rfqInvitations,
  rfqs,
  workspaces,
} from '@/lib/db/schema';
import { DRAFT_OWNER_ID } from '@/lib/server/storage/path';
import {
  seedBizProfile,
  seedBuyerWorkspace,
  seedMembership,
  seedUser,
} from '@/lib/server/repositories/drizzle/__tests__/_seed';
import { setupRfqActionEnv, teardownRfqActionEnv } from './_setup';
import type { PgliteDB } from '@/lib/db/client-pglite';

// Buyer session — patched per test.
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
  requireSession: () => {
    if (!sessionRef.value) return Promise.reject(new Error('UNAUTHENTICATED'));
    return Promise.resolve(sessionRef.value);
  },
  requireBuyerSession: () => {
    if (!sessionRef.value) return Promise.reject(new Error('FORBIDDEN_BUYER'));
    return Promise.resolve(sessionRef.value);
  },
}));

import { createRfqAction } from '../createRfqAction';

let db: PgliteDB;
let buyerUserId: string;
let buyerWsId: string;
let bizId: string;

async function freshBuyer() {
  const u = await seedUser(db, { email: 'buyer@x.com' });
  const biz = await seedBizProfile(db);
  const ws = await seedBuyerWorkspace(db, { bizProfileId: biz.id });
  await seedMembership(db, ws.id, u.id, 'admin');
  return { userId: u.id, email: u.email, wsId: ws.id, bizId: biz.id };
}

describe('createRfqAction', () => {
  beforeEach(async () => {
    db = await setupRfqActionEnv();
    const seeded = await freshBuyer();
    buyerUserId = seeded.userId;
    buyerWsId = seeded.wsId;
    bizId = seeded.bizId;
    sessionRef.value = {
      user: {
        id: buyerUserId,
        email: seeded.email,
        workspaceId: buyerWsId,
        workspaceType: 'buyer',
        role: 'admin',
      },
    };
  });
  afterEach(() => {
    teardownRfqActionEnv();
    sessionRef.value = null;
  });

  it('rejects without buyer session', async () => {
    sessionRef.value = null;
    const r = await createRfqAction({
      title: 't',
      deadline: new Date(Date.now() + 86_400_000).toISOString(),
      allowedPgEmails: ['a@b.com'],
    });
    expect(r.ok).toBe(false);
  });

  it('draft branch — inserts RFQ status=draft, no invitations, no outbox', async () => {
    const r = await createRfqAction({
      title: '결제 인프라 견적',
      memo: 'D+1 정산 희망',
      deadline: new Date(Date.now() + 86_400_000).toISOString(),
      allowedPgEmails: ['sales@toss.im', 'sales@inicis.com'],
      send: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rfqId).toMatch(/^Q-\d{4}-\d{4}$/);

    const [row] = await db.select().from(rfqs).where(eq(rfqs.id, r.rfqId));
    expect(row.status).toBe('draft');
    expect(row.sentAt).toBeNull();

    const invs = await db
      .select()
      .from(rfqInvitations)
      .where(eq(rfqInvitations.rfqId, r.rfqId));
    expect(invs).toHaveLength(0);

    const outbox = await db
      .select()
      .from(outboxEntries)
      .where(eq(outboxEntries.event, 'rfq.invited'));
    expect(outbox).toHaveLength(0);
  });

  it('send branch — inserts RFQ status=sent, N invitations + N invite outbox + 1 sent outbox', async () => {
    const emails = ['a@toss.im', 'b@inicis.com', 'c@kakaopay.com'];
    const r = await createRfqAction({
      title: '결제 인프라 견적',
      deadline: new Date(Date.now() + 86_400_000).toISOString(),
      allowedPgEmails: emails,
      send: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const [row] = await db.select().from(rfqs).where(eq(rfqs.id, r.rfqId));
    expect(row.status).toBe('sent');
    expect(row.sentAt).not.toBeNull();

    const invs = await db
      .select()
      .from(rfqInvitations)
      .where(eq(rfqInvitations.rfqId, r.rfqId));
    expect(invs).toHaveLength(emails.length);
    for (const inv of invs) {
      expect(inv.tokenHash).toBeTruthy();
      expect(emails).toContain(inv.pgEmail);
      expect(inv.status).toBe('pending');
    }

    const inviteRows = await db
      .select()
      .from(outboxEntries)
      .where(eq(outboxEntries.event, 'rfq.invited'));
    expect(inviteRows).toHaveLength(emails.length);
    // Per-email dedupe key.
    const dedupeKeys = inviteRows.map((r) => r.dedupeKey).sort();
    expect(dedupeKeys).toEqual(
      emails.map((e) => `rfq:${row.id}:invite:${e}`).sort(),
    );

    const sentRows = await db
      .select()
      .from(outboxEntries)
      .where(eq(outboxEntries.event, 'rfq.sent'));
    expect(sentRows).toHaveLength(1);
    expect(sentRows[0].dedupeKey).toBe(`rfq:${row.id}:sent`);
  });

  it('inserts a new biz_profiles snapshot row (RFQ-specific) without altering workspace.biz_profile_id (advisor pin 1)', async () => {
    const before = await db
      .select({ id: workspaces.bizProfileId })
      .from(workspaces)
      .where(eq(workspaces.id, buyerWsId));
    const wsBizBefore = before[0].id;
    expect(wsBizBefore).toBe(bizId);

    const r = await createRfqAction({
      title: '스냅샷 검증',
      deadline: new Date(Date.now() + 86_400_000).toISOString(),
      allowedPgEmails: ['x@y.com'],
      send: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const [rfqRow] = await db.select().from(rfqs).where(eq(rfqs.id, r.rfqId));
    expect(rfqRow.bizProfileId).not.toBe(wsBizBefore);

    // Snapshot row is its own biz_profiles id.
    const allBiz = await db.select().from(bizProfiles);
    expect(allBiz.map((b) => b.id)).toContain(rfqRow.bizProfileId);

    // 🚨 workspace.biz_profile_id must remain unchanged.
    const after = await db
      .select({ id: workspaces.bizProfileId })
      .from(workspaces)
      .where(eq(workspaces.id, buyerWsId));
    expect(after[0].id).toBe(wsBizBefore);
  });

  it('gradeOverride: snapshot grade differs + gradeSource=user_overridden + confirmedBy=session.user', async () => {
    const r = await createRfqAction({
      title: 'override',
      deadline: new Date(Date.now() + 86_400_000).toISOString(),
      allowedPgEmails: ['x@y.com'],
      gradeOverride: 'sme1',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const [rfqRow] = await db.select().from(rfqs).where(eq(rfqs.id, r.rfqId));
    expect(rfqRow.bizProfileId).not.toBeNull();
    if (!rfqRow.bizProfileId) return;
    const [snap] = await db
      .select()
      .from(bizProfiles)
      .where(eq(bizProfiles.id, rfqRow.bizProfileId));
    expect(snap.grade).toBe('sme1');
    expect(snap.gradeSource).toBe('user_overridden');
    expect(snap.gradeConfirmedBy).toBe(buyerUserId);
    expect(snap.gradeConfirmedAt).not.toBeNull();
  });

  it('without gradeOverride: snapshot inherits source/confirmedBy from current biz_profile', async () => {
    const r = await createRfqAction({
      title: 'inherit',
      deadline: new Date(Date.now() + 86_400_000).toISOString(),
      allowedPgEmails: ['x@y.com'],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const [rfqRow] = await db.select().from(rfqs).where(eq(rfqs.id, r.rfqId));
    expect(rfqRow.bizProfileId).not.toBeNull();
    if (!rfqRow.bizProfileId) return;
    const [snap] = await db
      .select()
      .from(bizProfiles)
      .where(eq(bizProfiles.id, rfqRow.bizProfileId));
    expect(snap.gradeSource).toBe('user_confirmed');
  });

  it('succeeds when workspace has no biz_profile_id — rfqRow.bizProfileId is null', async () => {
    await db
      .update(workspaces)
      .set({ bizProfileId: null })
      .where(eq(workspaces.id, buyerWsId));

    const r = await createRfqAction({
      title: 't',
      deadline: new Date(Date.now() + 86_400_000).toISOString(),
      allowedPgEmails: ['x@y.com'],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const [rfqRow] = await db.select().from(rfqs).where(eq(rfqs.id, r.rfqId));
    expect(rfqRow.bizProfileId).toBeNull();
  });

  it('issues monotonic Q-YYMM-NNNN ids within the month', async () => {
    const r1 = await createRfqAction({
      title: 'a',
      deadline: new Date(Date.now() + 86_400_000).toISOString(),
      allowedPgEmails: ['x@y.com'],
    });
    const r2 = await createRfqAction({
      title: 'b',
      deadline: new Date(Date.now() + 86_400_000).toISOString(),
      allowedPgEmails: ['x@y.com'],
    });
    expect(r1.ok && r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;
    const seq1 = Number(r1.rfqId.slice(-4));
    const seq2 = Number(r2.rfqId.slice(-4));
    expect(seq2).toBe(seq1 + 1);
  });

  it('rejects malformed input', async () => {
    const r = await createRfqAction({
      title: '',
      deadline: 'nope',
      allowedPgEmails: [],
    });
    expect(r.ok).toBe(false);
  });

  it('Step 11 — patches __draft__ attachments to the new RFQ id', async () => {
    // Pre-existing RFP attachment row uploaded against the draft sentinel
    // (mirrors what the dropzone does at file-select time).
    const draftAttId = randomUUID();
    await db.insert(attachments).values({
      id: draftAttId,
      ownerKind: 'rfq_rfp',
      ownerId: DRAFT_OWNER_ID,
      name: 'rfp.pdf',
      size: 100,
      mimeType: 'application/pdf',
      storagePath: '2026/05/dummy.pdf',
      uploadedBy: buyerUserId,
    });
    // Plus a foreign attachment that must NOT be touched (uploaded by
    // another user; same ownerId sentinel by chance).
    const otherUser = await seedUser(db, { email: 'other@x.com' });
    const foreignAttId = randomUUID();
    await db.insert(attachments).values({
      id: foreignAttId,
      ownerKind: 'rfq_rfp',
      ownerId: DRAFT_OWNER_ID,
      name: 'rfp-other.pdf',
      size: 100,
      mimeType: 'application/pdf',
      storagePath: '2026/05/dummy-other.pdf',
      uploadedBy: otherUser.id,
    });

    const r = await createRfqAction({
      title: '첨부 link-up 테스트',
      deadline: new Date(Date.now() + 86_400_000).toISOString(),
      allowedPgEmails: ['sales@toss.im'],
      rfpAttachmentIds: [draftAttId, foreignAttId],
      send: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const [own] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, draftAttId))
      .limit(1);
    expect(own?.ownerId).toBe(r.rfqId);

    const [foreign] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, foreignAttId))
      .limit(1);
    // Cross-user guard: action's WHERE includes uploaded_by — foreign row
    // stays on the draft sentinel.
    expect(foreign?.ownerId).toBe(DRAFT_OWNER_ID);
  });

  // _suppress unused import warnings
  void and;
});

import { and, eq, exists, gt, isNull, sql } from 'drizzle-orm';
import { rfqInvitations } from '@/lib/db/schema';
import type { DB } from '@/lib/db/client';
import type { RfqInvitation, InvitationStatus } from '@/lib/types/invitation';
import { hashToken } from '../../token';
import type { InvitationRepo, TokenClaimResult, Tx } from '../types';

type InvRow = typeof rfqInvitations.$inferSelect;

// DB enum is a subset of UI InvitationStatus — collapse 'declined' (UI-only) to
// the closest persisted value when encountered (defensive).
function dbStatusToUi(s: InvRow['status']): InvitationStatus {
  if (s === 'pending') return 'sent';
  return s as InvitationStatus;
}

// UI status → DB enum. 'sent'/'declined' fold into 'pending'/'expired'
// respectively for the persisted projection.
function uiStatusToDb(s: InvitationStatus): InvRow['status'] {
  switch (s) {
    case 'sent':
      return 'pending';
    case 'opened':
      return 'opened';
    case 'accepted':
      return 'accepted';
    case 'declined':
    case 'expired':
      return 'expired';
  }
}

function rowToInvitation(row: InvRow): RfqInvitation {
  return {
    id: row.id,
    rfqId: row.rfqId,
    pgEmail: row.pgEmail,
    pgWsId: row.pgWsId ?? undefined,
    acceptedByUserId: row.acceptedByUserId ?? undefined,
    // Raw token never leaves the DB — return placeholder. Callers must not
    // rely on `uniqueToken` post-retrieval; it exists for construction only.
    uniqueToken: '',
    sentAt: new Date(row.sentAt).toISOString(),
    openedAt: row.openedAt ? new Date(row.openedAt).toISOString() : undefined,
    expiresAt: new Date(row.expiresAt).toISOString(),
    status: dbStatusToUi(row.status),
  };
}

export class DrizzleInvitationRepository implements InvitationRepo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly _db: DB | any) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private h(tx?: Tx): any {
    return tx ?? this._db;
  }

  async save(inv: RfqInvitation, rawToken: string, tx?: Tx): Promise<void> {
    const db = this.h(tx);
    await db
      .insert(rfqInvitations)
      .values({
        id: inv.id,
        rfqId: inv.rfqId,
        pgEmail: inv.pgEmail,
        pgWsId: inv.pgWsId ?? null,
        acceptedByUserId: inv.acceptedByUserId ?? null,
        tokenHash: hashToken(rawToken),
        sentAt: new Date(inv.sentAt),
        openedAt: inv.openedAt ? new Date(inv.openedAt) : null,
        expiresAt: new Date(inv.expiresAt),
        status: uiStatusToDb(inv.status),
      })
      .onConflictDoUpdate({
        target: rfqInvitations.id,
        set: {
          pgWsId: inv.pgWsId ?? null,
          acceptedByUserId: inv.acceptedByUserId ?? null,
          openedAt: inv.openedAt ? new Date(inv.openedAt) : null,
          status: uiStatusToDb(inv.status),
        },
      });
  }

  async findById(id: string, tx?: Tx): Promise<RfqInvitation | undefined> {
    const db = this.h(tx);
    const [row] = await db
      .select()
      .from(rfqInvitations)
      .where(eq(rfqInvitations.id, id))
      .limit(1);
    return row ? rowToInvitation(row) : undefined;
  }

  async findByRfq(rfqId: string, tx?: Tx): Promise<RfqInvitation[]> {
    const db = this.h(tx);
    const rows = await db
      .select()
      .from(rfqInvitations)
      .where(eq(rfqInvitations.rfqId, rfqId));
    return rows.map(rowToInvitation);
  }

  async claimToken(
    rawToken: string,
    userId: string,
    tx?: Tx,
  ): Promise<TokenClaimResult> {
    const db = this.h(tx);
    const tokenHash = hashToken(rawToken);

    // Atomic: only succeed if token matches AND not yet accepted AND not expired.
    const updated = await db
      .update(rfqInvitations)
      .set({ acceptedByUserId: userId, status: 'accepted' })
      .where(
        and(
          eq(rfqInvitations.tokenHash, tokenHash),
          isNull(rfqInvitations.acceptedByUserId),
          gt(rfqInvitations.expiresAt, sql`now()`),
        ),
      )
      .returning();

    if (updated.length > 0) {
      return { ok: true, invitation: rowToInvitation(updated[0]) };
    }

    // Re-read to determine the failure reason (DB is source of truth).
    const [row] = await db
      .select()
      .from(rfqInvitations)
      .where(eq(rfqInvitations.tokenHash, tokenHash))
      .limit(1);
    if (!row) return { ok: false, reason: 'invalid' };
    if (row.acceptedByUserId) return { ok: false, reason: 'used' };
    return { ok: false, reason: 'expired' };
  }

  async canAccess(rfqId: string, userId: string, tx?: Tx): Promise<boolean> {
    const db = this.h(tx);
    const [row] = await db
      .select({
        ok: exists(
          db
            .select({ one: sql`1` })
            .from(rfqInvitations)
            .where(
              and(
                eq(rfqInvitations.rfqId, rfqId),
                eq(rfqInvitations.acceptedByUserId, userId),
              ),
            ),
        ).as('ok'),
      })
      .from(sql`(select 1) as _dummy`);
    return Boolean(row?.ok);
  }
}

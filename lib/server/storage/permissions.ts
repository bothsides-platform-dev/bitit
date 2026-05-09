/**
 * `canAccessAttachment` — single source of truth for file route ACLs.
 *
 * Rules per ownerKind:
 *
 *   `rfq_rfp` (RFP PDFs attached to a buyer-side RFQ)
 *     - Buyer ws members of the RFQ owner: ALLOW
 *     - PG ws members where `invitationRepo.canAccess(rfqId, pgWsId)` is true: ALLOW
 *     - Uploader themselves (covers pre-RFQ-create draft window where
 *       `ownerId` may not yet resolve to an `rfqs` row): ALLOW
 *     - Otherwise: DENY
 *
 *   `bid_proposal` (proposal PDF attached to a PG-side bid)
 *     - Buyer ws members of the underlying RFQ: ALLOW
 *     - Same-PG-workspace as the bid that references this attachment:
 *       ALLOW (so PG ws peers can view what was submitted)
 *     - Uploader themselves: ALLOW (pre-bid-create draft window)
 *     - Otherwise: DENY
 *
 * Cross-PG isolation is preserved — a PG user from a different ws
 * cannot read another PG's bid_proposal even if they were also invited
 * to the same RFQ.
 *
 * Lookups are direct DB reads (not through repos) for the join-heavy
 * queries that don't have repo methods today; the repo-shaped check
 * (`invitationRepo.canAccess`) is delegated for parity with the bid
 * action's gate.
 */
import { and, eq } from 'drizzle-orm';
import { rfqs, bids, workspaceMembers } from '@/lib/db/schema';
import type { Attachment } from '@/lib/types/common';
import type { InvitationRepo, Tx } from '@/lib/server/repositories/types';

export type AttachmentRow = Attachment & {
  ownerKind: 'rfq_rfp' | 'bid_proposal';
  ownerId: string;
  storagePath: string;
  uploadedBy: string;
};

export type AttachmentSession = {
  user: { id: string; workspaceId?: string; workspaceType?: 'buyer' | 'pg' };
};

export type RepoBundleForAttachment = {
  invitation: InvitationRepo;
};

export async function canAccessAttachment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  att: AttachmentRow,
  session: AttachmentSession,
  repos: RepoBundleForAttachment,
  tx?: Tx,
): Promise<boolean> {
  const userId = session.user.id;
  const wsId = session.user.workspaceId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const h: any = tx ?? db;

  // Uploader themselves can always read their own upload — covers the
  // narrow window between upload and the form action that links the
  // row to a real RFQ/bid.
  if (att.uploadedBy === userId) return true;

  if (att.ownerKind === 'rfq_rfp') {
    // Look up the RFQ owner. ownerId may not resolve if upload landed
    // before the RFQ row was created (uploader path above already
    // covered that case); a missing row from here means we can't ACL
    // and must deny.
    const [rfq] = await h
      .select({ buyerWsId: rfqs.buyerWsId })
      .from(rfqs)
      .where(eq(rfqs.id, att.ownerId))
      .limit(1);
    if (!rfq) return false;

    // Buyer ws membership — any member (admin/member) of the owning ws.
    if (wsId && rfq.buyerWsId === wsId) {
      const [member] = await h
        .select({ userId: workspaceMembers.userId })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, wsId),
            eq(workspaceMembers.userId, userId),
          ),
        )
        .limit(1);
      if (member) return true;
    }

    // PG side — invitation gates by workspace membership (any member of an
    // invited PG ws may read the RFP PDF).
    if (
      wsId &&
      (await repos.invitation.canAccess(att.ownerId, wsId, tx))
    ) {
      return true;
    }

    return false;
  }

  // bid_proposal — find the bid that points at this attachment id.
  // If no bid yet (pre-submit draft window), only the uploader can read,
  // which was already handled above.
  const [bid] = await h
    .select({
      pgWsId: bids.pgWsId,
      rfqId: bids.rfqId,
    })
    .from(bids)
    .where(eq(bids.proposalAttachmentId, att.id))
    .limit(1);

  if (!bid) return false;

  // PG workspace peers — same workspace as the bid submitter.
  if (wsId && bid.pgWsId === wsId) return true;

  // Buyer ws — RFQ's owning workspace.
  const [rfqRow] = await h
    .select({ buyerWsId: rfqs.buyerWsId })
    .from(rfqs)
    .where(eq(rfqs.id, bid.rfqId))
    .limit(1);
  if (!rfqRow) return false;
  if (wsId && rfqRow.buyerWsId === wsId) {
    const [member] = await h
      .select({ userId: workspaceMembers.userId })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, wsId),
          eq(workspaceMembers.userId, userId),
        ),
      )
      .limit(1);
    if (member) return true;
  }

  return false;
}

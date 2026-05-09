'use server';

import { and, eq } from 'drizzle-orm';
import { bids, rfqs, workspaces } from '@/lib/db/schema';
import { requireSession } from '@/lib/auth/session';
import { actionDb } from '../auth/_shared';

export type BidSearchItem = {
  bidId: string;
  rfqId: string;
  rfqTitle: string;
  pgWsName: string;   // buyer에서만 채워짐, PG는 ''
  memo: string;
  href: string;       // buyer → /rfq/[rfqId], pg → /inbox/[rfqId]
};

export async function searchBidsAction(): Promise<BidSearchItem[]> {
  let session;
  try {
    session = await requireSession();
  } catch {
    return [];
  }

  const user = session.user as {
    id: string;
    workspaceId?: string;
    workspaceType?: string;
  };

  const { workspaceId, workspaceType } = user;
  if (!workspaceId || !workspaceType) return [];

  const db = actionDb();

  if (workspaceType === 'buyer') {
    const rows = await db
      .select({
        bidId: bids.id,
        rfqId: rfqs.id,
        rfqTitle: rfqs.title,
        pgWsName: workspaces.name,
        memo: bids.memo,
      })
      .from(bids)
      .innerJoin(rfqs, eq(bids.rfqId, rfqs.id))
      .innerJoin(workspaces, eq(bids.pgWsId, workspaces.id))
      .where(and(eq(rfqs.buyerWsId, workspaceId), eq(bids.status, 'submitted')))
      .limit(30);

    return rows.map((r: typeof rows[number]) => ({ ...r, href: `/rfq/${r.rfqId}` }));
  }

  if (workspaceType === 'pg') {
    const rows = await db
      .select({
        bidId: bids.id,
        rfqId: rfqs.id,
        rfqTitle: rfqs.title,
        memo: bids.memo,
      })
      .from(bids)
      .innerJoin(rfqs, eq(bids.rfqId, rfqs.id))
      .where(and(eq(bids.pgWsId, workspaceId), eq(bids.status, 'submitted')))
      .limit(30);

    return rows.map((r: typeof rows[number]) => ({ ...r, pgWsName: '', href: `/inbox/${r.rfqId}` }));
  }

  return [];
}

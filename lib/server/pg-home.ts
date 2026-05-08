import type { RfqInvitation } from '@/lib/types/invitation';
import type { RFQ } from '@/lib/types/rfq';
import type { Bid } from '@/lib/types/bid';

export type PgHomeData = {
  kpi: { total: number; pending: number; submitted: number; won: number };
  pendingPairs: { invitation: RfqInvitation; rfq: RFQ }[];
  recentBids: { bid: Bid; rfqTitle: string; stage: 'won' | 'lost' | 'pending' }[];
};

export function computePgHomeData(
  pairs: { invitation: RfqInvitation; rfq: RFQ }[],
  bids: Bid[],
): PgHomeData {
  const rfqMap = new Map(pairs.map((p) => [p.rfq.id, p.rfq]));
  const userRfqIds = new Set(pairs.map((p) => p.rfq.id));
  const userBids = bids.filter((b) => userRfqIds.has(b.rfqId));

  const total = pairs.length;

  // Discriminate pending vs submitted by bid presence, not invitation status
  const submittedBidRfqIds = new Set(
    userBids.filter((b) => b.status === 'submitted').map((b) => b.rfqId),
  );
  const pending = pairs.filter((p) => !submittedBidRfqIds.has(p.rfq.id)).length;
  const submitted = pairs.filter((p) => submittedBidRfqIds.has(p.rfq.id)).length;
  const won = userBids.filter((b) => rfqMap.get(b.rfqId)?.awardedBidId === b.id).length;

  const pendingPairs = pairs
    .filter((p) => !submittedBidRfqIds.has(p.rfq.id))
    .sort(
      (a, b) =>
        new Date(a.rfq.deadline).getTime() - new Date(b.rfq.deadline).getTime(),
    );

  const recentBids = userBids
    .filter((b) => b.status === 'submitted' && b.submittedAt)
    .sort(
      (a, b) =>
        new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime(),
    )
    .slice(0, 3)
    .map((bid) => {
      const rfq = rfqMap.get(bid.rfqId);
      const stage: 'won' | 'lost' | 'pending' =
        rfq?.awardedBidId === bid.id
          ? 'won'
          : rfq?.status === 'awarded'
            ? 'lost'
            : 'pending';
      return { bid, rfqTitle: rfq?.title ?? '', stage };
    });

  return { kpi: { total, pending, submitted, won }, pendingPairs, recentBids };
}

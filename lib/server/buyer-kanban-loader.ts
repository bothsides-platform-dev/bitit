// Buyer 홈 칸반 데이터 로더 — repo 호출 + 분류 + 직렬화.
// 이 파일은 server-only — DB / repo factory 를 import 하므로 client component 에서
// import 하면 번들에 postgres 가 포함돼 빌드 깨짐. RSC 에서만 호출.
import {
  getRfqRepo,
  getBidRepo,
  getInvitationRepo,
} from './repositories/factory';
import {
  classifyBuyerRfq,
  toBuyerCard,
  compareBuyerCards,
  type BuyerKanbanCard,
} from './buyer-kanban';

export async function getBuyerKanbanData(
  workspaceId: string,
): Promise<BuyerKanbanCard[]> {
  const [rfqRepo, bidRepo, invRepo] = await Promise.all([
    getRfqRepo(),
    getBidRepo(),
    getInvitationRepo(),
  ]);
  const rfqs = await rfqRepo.findByBuyerWs(workspaceId);
  const now = new Date();

  // 워크스페이스 별 RFQ 수가 많지 않은 v0 가정 — RFQ 당 bid/invitation 병렬 fetch.
  // 추후 N+1 가 문제되면 batch 메서드 추가.
  const cards = await Promise.all(
    rfqs.map(async (rfq) => {
      const [bids, invitations] = await Promise.all([
        bidRepo.findByRfq(rfq.id),
        invRepo.findByRfq(rfq.id),
      ]);
      const stage = classifyBuyerRfq({ rfq, bids, invitations, now });
      return toBuyerCard({ rfq, bids, invitations, stage });
    }),
  );

  return cards.sort(compareBuyerCards);
}

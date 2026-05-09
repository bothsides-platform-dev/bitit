// PG 홈 칸반 데이터 로더 — repo 호출 + 분류 + 직렬화.
// 이 파일은 server-only — DB / repo factory 를 import 하므로 client component 에서
// import 하면 번들에 postgres 가 포함돼 빌드 깨짐. RSC 에서만 호출.
import { getInvitationRepo, getBidRepo } from './repositories/factory';
import type { Bid } from '@/lib/types/bid';
import {
  classifyPgInvitation,
  toPgCard,
  comparePgCards,
  type PgKanbanCard,
} from './pg-kanban';

export async function getPgKanbanData(
  workspaceId: string,
): Promise<PgKanbanCard[]> {
  const [invRepo, bidRepo] = await Promise.all([
    getInvitationRepo(),
    getBidRepo(),
  ]);
  const [pairs, bids] = await Promise.all([
    invRepo.findByPgWorkspace(workspaceId),
    bidRepo.findByPgWs(workspaceId),
  ]);

  // (rfqId, pgWsId) → 본인 워크스페이스의 bid. PG 워크스페이스는 RFQ 당 1개 bid 만 가짐
  // (sendDraftInvitations 의 unique constraint).
  const bidByRfq = new Map<string, Bid>();
  for (const b of bids) bidByRfq.set(b.rfqId, b);

  const cards = pairs.map(({ invitation, rfq }) => {
    const bid = bidByRfq.get(rfq.id);
    const stage = classifyPgInvitation({ invitation, bid, rfq });
    return toPgCard({ invitation, bid, rfq, stage });
  });

  return cards.sort(comparePgCards);
}

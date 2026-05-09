import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import {
  getBidRepo,
  getRfqRepo,
  getWorkspaceRepo,
} from '@/lib/server/repositories/factory';
import { AwardConfirm } from '@/components/rfq/AwardConfirm';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bidId?: string }>;
};

export default async function AwardPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const session = await auth();
  if (!session?.user?.id || session.user.workspaceType !== 'buyer') {
    redirect(`/login?next=/rfq/${id}/award`);
  }

  const rfq = await (await getRfqRepo()).findById(id);
  if (!rfq || rfq.buyerWsId !== session.user.workspaceId) {
    return (
      <div className="px-8 py-8">
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--md-sys-color-outline)]">
          RFQ를 찾을 수 없습니다.
        </p>
        <Link
          href={`/rfq/${id}`}
          className="mt-4 inline-block font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
        >
          ← RFQ 상세로
        </Link>
      </div>
    );
  }

  const allBids = (await (await getBidRepo()).findByRfq(id)).filter(
    (b) => b.status === 'submitted',
  );
  const bidId = sp.bidId;
  const selected = bidId ? allBids.find((b) => b.id === bidId) : undefined;
  if (!selected) {
    return (
      <div className="px-8 py-8">
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--md-sys-color-outline)]">
          선택된 견적을 찾을 수 없습니다.
        </p>
        <Link
          href={`/rfq/${id}`}
          className="mt-4 inline-block font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
        >
          ← RFQ 상세로
        </Link>
      </div>
    );
  }

  const others = allBids.filter((b) => b.id !== selected.id);

  // PG 워크스페이스 이름 lookup. allBids에 등장하는 모든 pgWsId 만 hydrate.
  const wsRepo = await getWorkspaceRepo();
  const pgWsIds = Array.from(new Set(allBids.map((b) => b.pgWsId)));
  const pgWsNameById: Record<string, string> = {};
  for (const wsId of pgWsIds) {
    const ws = await wsRepo.findById(wsId);
    if (ws) pgWsNameById[wsId] = ws.name;
  }
  const buyerWs = await wsRepo.findById(rfq.buyerWsId);

  return (
    <AwardConfirm
      rfqId={rfq.id}
      rfqDeadline={rfq.deadline}
      rfqAllowedCount={rfq.allowedPgEmails.length}
      bizProfile={{
        bizNo: rfq.bizProfile?.bizNo,
        grade: rfq.bizProfile?.grade,
      }}
      buyerWorkspaceName={buyerWs?.name ?? '—'}
      selected={selected}
      others={others}
      pgWsNameById={pgWsNameById}
      alreadyAwarded={rfq.status === 'awarded'}
    />
  );
}

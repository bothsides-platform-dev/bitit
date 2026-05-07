// Step 8: PG RFQ 상세 (RSC) + 견적 작성 폼.
//
// 가드 (advisor pin 2): canAccess(rfqId, userId) — 도메인 동료 차단.
// 클레임한 본인만 진입 가능. false면 notFound() (404).
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import {
  getBidRepo,
  getInvitationRepo,
  getRfqRepo,
} from '@/lib/server/repositories/factory';
import { RfqBriefPanel } from '@/components/inbox/RfqBriefPanel';
import { BidForm } from '@/components/inbox/BidForm';

type Props = { params: Promise<{ rfqId: string }> };

export const dynamic = 'force-dynamic';

export default async function InboxDetailPage({ params }: Props) {
  const { rfqId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect(`/login?next=/inbox/${rfqId}`);

  const invRepo = await getInvitationRepo();
  // canAccess: 클레임한 본인만 진입(도메인 동료 차단). false면 404.
  const ok = await invRepo.canAccess(rfqId, session.user.id);
  if (!ok) notFound();

  const rfqRepo = await getRfqRepo();
  const rfq = await rfqRepo.findById(rfqId);
  if (!rfq) notFound();

  // 이미 입찰을 제출했는지 확인 — submitted 상태면 작성 폼 대신 confirm 화면.
  const bidRepo = await getBidRepo();
  const allBids = await bidRepo.findByRfq(rfqId);
  const myBid = allBids.find(
    (b) =>
      b.pgWsId === session.user!.workspaceId && b.status === 'submitted',
  );

  if (myBid) {
    return (
      <div className="px-8 py-8 max-w-[600px]">
        <RfqBriefPanel rfq={rfq} />
        <div className="mt-10 border-t border-[var(--color-hair)] pt-8 space-y-4">
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-moss)]">
            ✓ 견적 제출 완료
          </p>
          <p className="text-[13px] text-[var(--color-ink-muted)]">
            제출 시각:{' '}
            {myBid.submittedAt
              ? new Date(myBid.submittedAt).toLocaleString('ko-KR')
              : '—'}
          </p>
          <Link
            href={`/inbox/${rfqId}/submitted`}
            className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            제출 내역 보기 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 grid grid-cols-[340px_1fr] gap-12 max-w-[1100px]">
      {/* Left: RFQ brief */}
      <div className="border-r border-[var(--color-hair)] pr-10">
        <RfqBriefPanel rfq={rfq} />
      </div>

      {/* Right: Bid form */}
      <div>
        <div className="mb-8">
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">
            정형 견적 입력
          </span>
          <h2 className="text-[22px] font-[700] tracking-[-0.02em] text-[var(--color-ink)] mt-1">
            견적 작성
          </h2>
        </div>
        <BidForm rfqId={rfqId} grade={rfq.bizProfile.grade} />
      </div>
    </div>
  );
}

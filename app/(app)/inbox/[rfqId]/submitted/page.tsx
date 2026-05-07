// Step 8: 제출 완료 화면 (RSC + canAccess 가드).
//
// canAccess 게이트로 도메인 동료 차단. 본인 ws의 submitted bid를 hydrate.
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import {
  getBidRepo,
  getInvitationRepo,
  getRfqRepo,
} from '@/lib/server/repositories/factory';
import { GRADE_LABELS } from '@/lib/types/biz-profile';
import { formatDate, formatPct, formatKRW } from '@/lib/format';

type Props = { params: Promise<{ rfqId: string }> };

export const dynamic = 'force-dynamic';

const SETTLE_LABEL: Record<string, string> = {
  'D+0': 'D+0 (당일)',
  'D+1': 'D+1 (익일)',
  'D+2': 'D+2 (2영업일)',
  weekly: '주 1회',
  monthly: '월 1회',
};

export default async function InboxSubmittedPage({ params }: Props) {
  const { rfqId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect(`/login?next=/inbox/${rfqId}/submitted`);

  const invRepo = await getInvitationRepo();
  const ok = await invRepo.canAccess(rfqId, session.user.id);
  if (!ok) notFound();

  const rfqRepo = await getRfqRepo();
  const rfq = await rfqRepo.findById(rfqId);
  if (!rfq) notFound();

  const bidRepo = await getBidRepo();
  const allBids = await bidRepo.findByRfq(rfqId);
  const bid = allBids.find(
    (b) => b.pgWsId === session.user!.workspaceId && b.status === 'submitted',
  );

  if (!bid) {
    return (
      <div className="px-8 py-8">
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
          제출된 견적이 없습니다.
        </p>
        <Link
          href={`/inbox/${rfqId}`}
          className="mt-4 block font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          ← 견적 작성으로
        </Link>
      </div>
    );
  }

  const grade = rfq.bizProfile?.grade;

  return (
    <div className="px-8 py-8 space-y-10">
      {/* Status */}
      <div>
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-moss)] mb-3">
          ✓ 제출 완료
        </p>
        <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          견적이 제출되었습니다
        </h1>
        <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
          구매사가 마감일까지 비교·검토 후 결과를 알립니다.
        </p>
        {bid.submittedAt && (
          <p className="mt-1 font-mono text-[11px] tabular-nums text-[var(--color-ink-soft)]">
            제출 {new Date(bid.submittedAt).toLocaleString('ko-KR')}
          </p>
        )}
      </div>

      {/* RFQ summary */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">견적 요청</span>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
          {[
            ['RFQ', rfq.id],
            ['제목', rfq.title],
            ['등급', grade ? GRADE_LABELS[grade] : '—'],
            ['마감', formatDate(rfq.deadline)],
          ].map(([label, value]) => (
            <div key={label} className="py-2.5 flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">{label}</span>
              <span className="text-[13px] text-[var(--color-ink)]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bid summary */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">제출 견적</span>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
          {[
            ['정산 주기', SETTLE_LABEL[bid.settleCycle] ?? bid.settleCycle],
            ['보증금', formatKRW(bid.deposit)],
            ['셋업비', formatKRW(bid.setupFee)],
            ['월최저수수료', formatKRW(bid.monthlyMin)],
            ['계좌이체', formatPct(bid.bankTransferFeePct)],
            ['간편결제', formatPct(bid.easyPayFeePct)],
          ].map(([label, value]) => (
            <div key={label} className="py-2.5 flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">{label}</span>
              <span className="font-mono text-[13px] tabular-nums text-[var(--color-ink)]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Link
          href="/inbox"
          className="block font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          ← 수신함으로
        </Link>
      </div>
    </div>
  );
}

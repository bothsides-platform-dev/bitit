'use client';

import { use } from 'react';
import { RfqBriefPanel } from '@/components/inbox/RfqBriefPanel';
import { BidForm } from '@/components/inbox/BidForm';
import { MOCK_RFQS } from '@/lib/mock/rfqs';
import { MOCK_INVITATIONS } from '@/lib/mock/invitations';
import { MOCK_SESSION_PG } from '@/lib/mock/workspaces';
import { useBidListStore } from '@/lib/stores/bid-list';
import Link from 'next/link';

type Props = { params: Promise<{ rfqId: string }> };

export default function InboxDetailPage({ params }: Props) {
  const { rfqId } = use(params);
  const bids = useBidListStore((s) => s.bids);

  const rfq = MOCK_RFQS.find((r) => r.id === rfqId);
  const invitation = MOCK_INVITATIONS.find(
    (inv) => inv.rfqId === rfqId && inv.acceptedByUserId === MOCK_SESSION_PG.userId,
  ) ?? MOCK_INVITATIONS.find((inv) => inv.rfqId === rfqId);

  const myBid = bids.find(
    (b) => b.rfqId === rfqId && b.pgWsId === MOCK_SESSION_PG.workspaceId,
  );

  if (!rfq) {
    return (
      <div className="px-8 py-8">
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
          RFQ를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  if (myBid) {
    return (
      <div className="px-8 py-8 max-w-[600px]">
        <RfqBriefPanel rfq={rfq} />
        <div className="mt-10 border-t border-[var(--color-hair)] pt-8 space-y-4">
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-moss)]">
            ✓ 견적 제출 완료
          </p>
          <p className="text-[13px] text-[var(--color-ink-muted)]">
            제출 시각: {myBid.submittedAt ? new Date(myBid.submittedAt).toLocaleString('ko-KR') : '—'}
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
            FIG. 01 — 정형 견적 입력
          </span>
          <h2 className="text-[22px] font-[700] tracking-[-0.02em] text-[var(--color-ink)] mt-1">
            견적 작성
          </h2>
        </div>
        <BidForm
          rfqId={rfqId}
          invitationId={invitation?.id ?? ''}
          grade={rfq.bizProfile.grade}
        />
      </div>
    </div>
  );
}

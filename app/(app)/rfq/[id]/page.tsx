'use client';

import { use } from 'react';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Tag } from '@/components/primitives/Tag';
import { Button } from '@/components/primitives/Button';
import { BidComparisonTable } from '@/components/rfq/BidComparisonTable';
import { useRfqListStore } from '@/lib/stores/rfq-list';
import { useBidListStore } from '@/lib/stores/bid-list';
import { GRADE_LABELS } from '@/lib/mock/biz-lookup';
import { STATUTORY_CARD_FEE } from '@/lib/types/bid';
import { formatDate } from '@/lib/format';
import Link from 'next/link';

type Props = { params: Promise<{ id: string }> };

const statusLabel: Record<string, string> = {
  draft: '임시저장', sent: '발송됨', closed: '마감', awarded: '계약완료', cancelled: '취소',
};
const statusVariant: Record<string, 'default' | 'amber' | 'moss' | 'terracotta' | 'muted'> = {
  draft: 'muted', sent: 'amber', closed: 'muted', awarded: 'moss', cancelled: 'terracotta',
};

export default function RfqDetailPage({ params }: Props) {
  const { id } = use(params);
  const rfqs = useRfqListStore((s) => s.rfqs);
  const bids = useBidListStore((s) => s.bids);

  const rfq = rfqs.find((r) => r.id === id);
  const rfqBids = bids.filter((b) => b.rfqId === id && b.status === 'submitted');

  if (!rfq) {
    return (
      <div className="px-8 py-8">
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
          RFQ를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  const { bizProfile } = rfq;
  const cardFee = bizProfile.grade ? STATUTORY_CARD_FEE[bizProfile.grade] : NaN;

  return (
    <div className="px-8 py-8 max-w-[1100px] space-y-10">
      {/* Header */}
      <div>
        <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-soft)]">{rfq.id}</span>
        <div className="flex items-start justify-between mt-1 gap-4">
          <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
            {rfq.title}
          </h1>
          <div className="flex items-center gap-3 shrink-0">
            <Tag variant={statusVariant[rfq.status]}>{statusLabel[rfq.status]}</Tag>
            {rfq.status === 'sent' && rfqBids.length > 0 && (
              <Link href={`/rfq/${id}/award`}>
                <Button size="sm">수주 처리 →</Button>
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <Eyebrow>마감 {formatDate(rfq.deadline)}</Eyebrow>
          <span className="text-[var(--color-hair-strong)]">·</span>
          <Eyebrow>PG {rfq.allowedPgEmails.length}개사</Eyebrow>
          <span className="text-[var(--color-hair-strong)]">·</span>
          <Eyebrow>받은 견적 {rfqBids.length}건</Eyebrow>
        </div>
      </div>

      {/* Comparison table */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">
            FIG. 01 — 견적 비교
          </span>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <BidComparisonTable
          rfqId={id}
          bids={rfqBids}
          grade={bizProfile.grade}
          rfqStatus={rfq.status}
        />
      </section>

      {/* Meta sidebar */}
      <div className="grid grid-cols-2 gap-10 border-t border-[var(--color-hair)] pt-8">
        {/* Biz info */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <Eyebrow>사업자 정보</Eyebrow>
            <div className="flex-1 h-px bg-[var(--color-hair)]" />
          </div>
          <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
            {[
              ['상호명', bizProfile.name],
              ['사업자번호', bizProfile.bizNo],
              ['대표자', bizProfile.ceoName],
              ...(bizProfile.grade
                ? [
                    ['등급', GRADE_LABELS[bizProfile.grade]],
                    ['카드', isNaN(cardFee) ? '카드사별 협의' : `${(cardFee * 100).toFixed(2)}%`],
                  ]
                : []),
            ].map(([label, value]) => (
              <div key={label} className="py-2 flex items-baseline justify-between">
                <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">{label}</span>
                <span className="text-[13px] text-[var(--color-ink)]">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* PG list + memo */}
        <section className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Eyebrow>초대 PG</Eyebrow>
              <div className="flex-1 h-px bg-[var(--color-hair)]" />
            </div>
            <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
              {rfq.allowedPgEmails.map((email, i) => (
                <div key={email} className="py-2 flex items-center gap-3">
                  <span className="font-mono text-[10px] tabular-nums text-[var(--color-ink-faint)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] text-[var(--color-ink)]">{email}</span>
                </div>
              ))}
            </div>
          </div>
          {rfq.memo && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Eyebrow>메모</Eyebrow>
                <div className="flex-1 h-px bg-[var(--color-hair)]" />
              </div>
              <p className="text-[13px] text-[var(--color-ink-muted)] leading-relaxed whitespace-pre-wrap">
                {rfq.memo}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

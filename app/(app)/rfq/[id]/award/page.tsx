'use client';

import { use, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Tag } from '@/components/primitives/Tag';
import { Button } from '@/components/primitives/Button';
import { useRfqListStore } from '@/lib/stores/rfq-list';
import { useBidListStore } from '@/lib/stores/bid-list';
import { useNotificationsStore } from '@/lib/stores/notifications';
import { MOCK_WORKSPACES, MOCK_SESSION_BUYER } from '@/lib/mock/workspaces';
import { GRADE_LABELS } from '@/lib/mock/biz-lookup';
import { STATUTORY_CARD_FEE } from '@/lib/types/bid';
import { formatKRW, formatPct, formatDate } from '@/lib/format';

type Props = { params: Promise<{ id: string }> };

const SETTLE_LABEL: Record<string, string> = {
  'D+0': 'D+0 (당일)',
  'D+1': 'D+1 (익일)',
  'D+2': 'D+2 (2영업일)',
  weekly: '주 1회',
  monthly: '월 1회',
};

function pgName(wsId: string): string {
  return MOCK_WORKSPACES.find((w) => w.id === wsId)?.name ?? wsId;
}

export default function AwardPage({ params }: Props) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const bidId = searchParams.get('bidId');
  const router = useRouter();

  const rfqs = useRfqListStore((s) => s.rfqs);
  const awardRfq = useRfqListStore((s) => s.awardRfq);
  const bids = useBidListStore((s) => s.bids);
  const addNotification = useNotificationsStore((s) => s.add);

  const rfq = rfqs.find((r) => r.id === id);
  const allBids = bids.filter((b) => b.rfqId === id && b.status === 'submitted');
  const selected = bidId ? allBids.find((b) => b.id === bidId) : null;
  const others = allBids.filter((b) => b.id !== bidId);

  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!rfq || !selected) {
    return (
      <div className="px-8 py-8 max-w-[600px]">
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
          {!rfq ? 'RFQ를 찾을 수 없습니다.' : '선택된 견적을 찾을 수 없습니다.'}
        </p>
        <Link
          href={`/rfq/${id}`}
          className="mt-4 inline-block font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          ← RFQ 상세로
        </Link>
      </div>
    );
  }

  const grade = rfq.bizProfile.grade;
  const cardFee = grade && grade !== 'general' ? STATUTORY_CARD_FEE[grade] : null;
  const alreadyAwarded = rfq.status === 'awarded';

  const handleAward = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    awardRfq(id, selected.id);

    addNotification({
      userId: MOCK_SESSION_BUYER.userId,
      workspaceId: MOCK_SESSION_BUYER.workspaceId,
      type: 'award_confirmed',
      title: `${pgName(selected.pgWsId)} 수주 확정`,
      body: `${id} RFQ가 ${pgName(selected.pgWsId)}와 계약 완료 처리되었습니다.`,
      linkUrl: `/rfq/${id}`,
    });

    setSubmitting(false);
    setConfirmed(true);
  };

  if (confirmed || alreadyAwarded) {
    return (
      <div className="px-8 py-8 max-w-[640px] space-y-10">
        <div>
          <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-moss)] mb-3">
            ✓ 수주 확정
          </p>
          <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
            {pgName(selected.pgWsId)} 와의 계약이 확정되었습니다
          </h1>
          <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
            선정된 PG와 미선정 PG 모두에게 결과 알림이 발송됩니다.
          </p>
        </div>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <Eyebrow>발송 알림</Eyebrow>
            <div className="flex-1 h-px bg-[var(--color-hair)]" />
          </div>
          <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
            <div className="py-3 flex items-center gap-4">
              <Tag variant="moss">선정</Tag>
              <span className="text-[13px] text-[var(--color-ink)]">{pgName(selected.pgWsId)}</span>
              <span className="ml-auto font-mono text-[11px] tabular-nums text-[var(--color-ink-soft)]">
                계약 진행 안내
              </span>
            </div>
            {others.map((b) => (
              <div key={b.id} className="py-3 flex items-center gap-4">
                <Tag variant="muted">미선정</Tag>
                <span className="text-[13px] text-[var(--color-ink)]">{pgName(b.pgWsId)}</span>
                <span className="ml-auto font-mono text-[11px] tabular-nums text-[var(--color-ink-soft)]">
                  결과 안내
                </span>
              </div>
            ))}
            {others.length === 0 && (
              <div className="py-3 font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
                — 다른 응답 견적 없음 —
              </div>
            )}
          </div>
        </section>

        <div className="space-y-3">
          <Button onClick={() => router.push('/rfq')} fullWidth>
            RFQ 목록으로 →
          </Button>
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-faint)] text-center pt-2">
            — FIN —
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-[720px] space-y-10">
      {/* Header */}
      <div>
        <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-soft)]">{rfq.id} · 수주 처리</span>
        <h1 className="mt-1 text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          {pgName(selected.pgWsId)} 견적을 선택하시겠습니까?
        </h1>
        <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
          확정 시 선정 PG와 미선정 PG 모두에게 결과가 통지되며, RFQ가 마감 처리됩니다.
        </p>
      </div>

      {/* Selected bid summary */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <Eyebrow>FIG. 01 — 선택 견적</Eyebrow>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
          {[
            ['PG사', pgName(selected.pgWsId)],
            ['정산 주기', SETTLE_LABEL[selected.settleCycle] ?? selected.settleCycle],
            ['보증금', formatKRW(selected.deposit)],
            ['셋업비', formatKRW(selected.setupFee)],
            ['월최저수수료', formatKRW(selected.monthlyMin)],
            ...(cardFee !== null
              ? ([['카드 (법정)', formatPct(cardFee)]] as [string, string][])
              : []),
            ['계좌이체', formatPct(selected.bankTransferFeePct)],
            ['간편결제', formatPct(selected.easyPayFeePct)],
          ].map(([label, value]) => (
            <div key={label} className="py-2.5 flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">{label}</span>
              <span className="font-mono text-[13px] tabular-nums text-[var(--color-ink)]">{value}</span>
            </div>
          ))}
        </div>
        {selected.memo && (
          <div className="mt-4 p-4 bg-[var(--color-paper-warm)] border-l-2 border-[var(--color-hair-strong)]">
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)] mb-2">
              PG 메모
            </p>
            <p className="text-[13px] text-[var(--color-ink-muted)] leading-relaxed whitespace-pre-wrap">
              {selected.memo}
            </p>
          </div>
        )}
      </section>

      {/* Buyer / RFQ context */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <Eyebrow>FIG. 02 — 계약 조건</Eyebrow>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
          {[
            ['구매사', rfq.bizProfile.name],
            ['사업자번호', rfq.bizProfile.bizNo],
            ['등급', grade ? GRADE_LABELS[grade] : '—'],
            ['마감', formatDate(rfq.deadline)],
            ['초대 PG', `${rfq.allowedPgEmails.length}개사`],
            ['응답 견적', `${allBids.length}건`],
          ].map(([label, value]) => (
            <div key={label} className="py-2.5 flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">{label}</span>
              <span className="text-[13px] text-[var(--color-ink)]">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Confirm action */}
      <section className="border-t border-[var(--color-hair)] pt-6 space-y-4">
        <div className="bg-[var(--color-paper-warm)] border border-[var(--color-hair)] p-4">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)] mb-2">
            확정 후 처리
          </p>
          <ul className="space-y-1.5 text-[12px] text-[var(--color-ink-muted)]">
            <li>· RFQ 상태가 <span className="font-mono">awarded</span>로 전환됩니다</li>
            <li>· 미선정 PG {others.length}곳에 결과가 통지됩니다</li>
            <li>· 이후 견적 수정·철회는 불가합니다</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <Link href={`/rfq/${id}`} className="flex-1">
            <Button variant="secondary" fullWidth>
              ← 비교로 돌아가기
            </Button>
          </Link>
          <Button onClick={handleAward} disabled={submitting} className="flex-1">
            {submitting ? '처리 중…' : '수주 확정'}
          </Button>
        </div>
      </section>
    </div>
  );
}

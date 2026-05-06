'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Tag } from '@/components/primitives/Tag';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { EmptyState } from '@/components/primitives/EmptyState';
import { MOCK_INVITATIONS } from '@/lib/mock/invitations';
import { MOCK_RFQS } from '@/lib/mock/rfqs';
import { GRADE_LABELS } from '@/lib/mock/biz-lookup';
import { MOCK_SESSION_PG } from '@/lib/mock/workspaces';
import { formatDeadline } from '@/lib/format';
import { useListNavigation } from '@/lib/hooks/useListNavigation';
import { InboxIcon } from '@/components/icons';

const invStatusLabel: Record<string, string> = {
  sent: '신규',
  opened: '작성중',
  accepted: '제출완료',
  declined: '거절',
  expired: '만료',
};

const invStatusVariant: Record<string, 'default' | 'amber' | 'moss' | 'terracotta' | 'muted'> = {
  sent: 'amber',
  opened: 'default',
  accepted: 'moss',
  declined: 'terracotta',
  expired: 'muted',
};

export default function InboxPage() {
  const router = useRouter();
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);

  const rows = useMemo(() => {
    const myInvitations = MOCK_INVITATIONS.filter(
      (inv) => inv.acceptedByUserId === MOCK_SESSION_PG.userId || inv.status === 'sent',
    );
    return myInvitations
      .map((inv) => {
        const rfq = MOCK_RFQS.find((r) => r.id === inv.rfqId);
        return rfq ? { inv, rfq } : null;
      })
      .filter((r): r is { inv: typeof myInvitations[0]; rfq: typeof MOCK_RFQS[0] } => r !== null);
  }, []);

  const { active } = useListNavigation(rows.length, {
    onEnter: (i) => router.push(`/inbox/${rows[i].rfq.id}`),
    onEdit: (i) => router.push(`/inbox/${rows[i].rfq.id}`),
  });

  useEffect(() => {
    rowRefs.current[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--color-hair)]">
        <div>
          <Eyebrow>수신함 — PG 견적 요청</Eyebrow>
          <h1 className="text-[20px] font-[700] tracking-[-0.02em] text-[var(--color-ink)] mt-1">
            받은 견적 요청
          </h1>
        </div>
        <span className="font-mono tabular-nums text-[11px] text-[var(--color-ink-soft)]">
          {rows.length}건
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<InboxIcon size={32} />}
          title="받은 견적 요청이 없습니다."
          description="구매사가 초대한 RFQ가 이 화면에 표시됩니다."
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-[var(--color-paper)]">
              <tr className="border-b border-[var(--color-hair)]">
                <th className="px-8 py-3 text-left font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">번호</th>
                <th className="px-3 py-3 text-left font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">제목</th>
                <th className="px-3 py-3 text-left font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">구매사</th>
                <th className="px-3 py-3 text-left font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">등급</th>
                <th className="px-3 py-3 text-left font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">마감</th>
                <th className="px-3 py-3 text-right font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ inv, rfq }, i) => {
                const daysLeft = formatDeadline(rfq.deadline);
                const isUrgent = daysLeft.startsWith('D-') && parseInt(daysLeft.slice(2)) <= 3;
                return (
                  <tr
                    key={inv.id}
                    ref={(el) => { rowRefs.current[i] = el; }}
                    onClick={() => router.push(`/inbox/${rfq.id}`)}
                    data-active={active === i}
                    className="group border-b border-[var(--color-hair)] hover:bg-[var(--color-paper-warm)] data-[active=true]:bg-[var(--color-paper-warm)] cursor-pointer transition-colors"
                  >
                    <td className="relative px-8 py-4 font-mono text-[12px] tabular-nums text-[var(--color-ink-soft)] group-hover:before:absolute group-hover:before:left-0 group-hover:before:top-0 group-hover:before:bottom-0 group-hover:before:w-2 group-hover:before:bg-[var(--color-ink)] group-data-[active=true]:before:absolute group-data-[active=true]:before:left-0 group-data-[active=true]:before:top-0 group-data-[active=true]:before:bottom-0 group-data-[active=true]:before:w-2 group-data-[active=true]:before:bg-[var(--color-ink)]">
                      {rfq.id}
                    </td>
                    <td className="px-3 py-4 text-[13px] text-[var(--color-ink)] font-medium">{rfq.title}</td>
                    <td className="px-3 py-4 text-[13px] text-[var(--color-ink-muted)]">(주)샘플테크</td>
                    <td className="px-3 py-4 font-mono text-[12px] text-[var(--color-ink-muted)]">
                      {rfq.bizProfile.grade ? GRADE_LABELS[rfq.bizProfile.grade] : '—'}
                    </td>
                    <td className={`px-3 py-4 font-mono text-[12px] tabular-nums ${isUrgent ? 'text-[var(--color-terracotta)]' : 'text-[var(--color-ink-muted)]'}`}>
                      {daysLeft}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <Tag variant={invStatusVariant[inv.status]}>{invStatusLabel[inv.status]}</Tag>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-8 py-3 border-t border-[var(--color-hair)] flex items-center gap-4 font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-ink-faint)]">
            <span><kbd className="text-[var(--color-ink-soft)]">J</kbd> / <kbd className="text-[var(--color-ink-soft)]">K</kbd> 이동</span>
            <span><kbd className="text-[var(--color-ink-soft)]">Enter</kbd> 응답 작성</span>
          </div>
        </div>
      )}
    </div>
  );
}

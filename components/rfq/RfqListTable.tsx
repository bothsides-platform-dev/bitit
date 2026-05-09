'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Chip, type ChipColor } from '@/components/primitives/Chip';
import { useListNavigation } from '@/lib/hooks/useListNavigation';
import { formatDate } from '@/lib/format';
import type { RFQ } from '@/lib/types/rfq';

const statusLabel: Record<string, string> = {
  draft: '임시저장',
  sent: '발송됨',
  closed: '마감',
  awarded: '계약완료',
  cancelled: '취소',
};

const statusColor: Record<string, ChipColor> = {
  draft: 'surface',
  sent: 'warning',
  closed: 'surface',
  awarded: 'tertiary',
  cancelled: 'error',
};

type Props = { rfqs: RFQ[] };

export function RfqListTable({ rfqs }: Props) {
  const router = useRouter();
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);

  const { active } = useListNavigation(rfqs.length, {
    onEnter: (i) => router.push(`/rfq/${rfqs[i].id}`),
    onEdit: (i) => router.push(`/rfq/${rfqs[i].id}`),
  });

  useEffect(() => {
    rowRefs.current[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-[var(--color-paper)]">
          <tr className="border-b border-[var(--color-hair)]">
            <th className="px-8 py-3 text-left font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">
              번호
            </th>
            <th className="px-3 py-3 text-left font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">
              제목
            </th>
            <th className="px-3 py-3 text-left font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">
              마감
            </th>
            <th className="px-3 py-3 text-left font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">
              PG수
            </th>
            <th className="px-3 py-3 text-right font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">
              상태
            </th>
          </tr>
        </thead>
        <tbody>
          {rfqs.map((rfq, i) => (
            <tr
              key={rfq.id}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              onClick={() => router.push(`/rfq/${rfq.id}`)}
              data-active={active === i}
              className="group border-b border-[var(--color-hair)] hover:bg-[var(--color-paper-warm)] data-[active=true]:bg-[var(--color-paper-warm)] cursor-pointer transition-colors"
            >
              <td className="relative px-8 py-4 font-mono text-[12px] tabular-nums text-[var(--color-ink-soft)] group-hover:before:absolute group-hover:before:left-0 group-hover:before:top-0 group-hover:before:bottom-0 group-hover:before:w-2 group-hover:before:bg-[var(--color-ink)] group-data-[active=true]:before:absolute group-data-[active=true]:before:left-0 group-data-[active=true]:before:top-0 group-data-[active=true]:before:bottom-0 group-data-[active=true]:before:w-2 group-data-[active=true]:before:bg-[var(--color-ink)]">
                {rfq.id}
              </td>
              <td className="px-3 py-4 text-[13px] text-[var(--color-ink)] font-medium">
                {rfq.title}
              </td>
              <td className="px-3 py-4 font-mono text-[12px] tabular-nums text-[var(--color-ink-muted)]">
                {formatDate(rfq.deadline)}
              </td>
              <td className="px-3 py-4 font-mono text-[12px] tabular-nums text-[var(--color-ink-muted)]">
                {rfq.allowedPgEmails.length}
              </td>
              <td className="px-3 py-4 text-right">
                <Chip label={statusLabel[rfq.status]} color={statusColor[rfq.status]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-8 py-3 border-t border-[var(--color-hair)] flex items-center gap-4 font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-ink-faint)]">
        <span>
          <kbd className="text-[var(--color-ink-soft)]">J</kbd> /{' '}
          <kbd className="text-[var(--color-ink-soft)]">K</kbd> 이동
        </span>
        <span>
          <kbd className="text-[var(--color-ink-soft)]">Enter</kbd> 상세
        </span>
        <span>
          <kbd className="text-[var(--color-ink-soft)]">⌘N</kbd> 신규
        </span>
      </div>
    </div>
  );
}

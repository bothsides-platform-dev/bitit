'use client';

import { useEffect, useRef } from 'react';
import { Tag } from '@/components/primitives/Tag';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Button } from '@/components/primitives/Button';
import { EmptyState } from '@/components/primitives/EmptyState';
import { useRfqListStore } from '@/lib/stores/rfq-list';
import { useListNavigation } from '@/lib/hooks/useListNavigation';
import { formatDate } from '@/lib/format';
import Link from 'next/link';
import { FileTextIcon } from '@/components/icons';
import { useRouter } from 'next/navigation';

const statusLabel: Record<string, string> = {
  draft: '임시저장',
  sent: '발송됨',
  closed: '마감',
  awarded: '계약완료',
  cancelled: '취소',
};

const statusVariant: Record<string, 'default' | 'amber' | 'moss' | 'terracotta' | 'muted'> = {
  draft: 'muted',
  sent: 'amber',
  closed: 'muted',
  awarded: 'moss',
  cancelled: 'terracotta',
};

export default function RfqListPage() {
  const rfqs = useRfqListStore((s) => s.rfqs);
  const router = useRouter();
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);

  const { active, setActive } = useListNavigation(rfqs.length, {
    onEnter: (i) => router.push(`/rfq/${rfqs[i].id}`),
    onEdit: (i) => router.push(`/rfq/${rfqs[i].id}`),
  });

  useEffect(() => {
    rowRefs.current[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--color-hair)]">
        <div>
          <Eyebrow>RFQ — 견적 요청</Eyebrow>
          <h1 className="text-[20px] font-[700] tracking-[-0.02em] text-[var(--color-ink)] mt-1">
            견적 요청 목록
          </h1>
        </div>
        <Link href="/rfq/new">
          <Button size="sm">+ 신규 견적</Button>
        </Link>
      </div>

      {rfqs.length === 0 ? (
        <EmptyState
          icon={<FileTextIcon size={32} />}
          title="발송된 견적 요청이 없습니다."
          description="새로운 견적 요청을 작성해 PG사에 발송하세요."
          action={
            <Link href="/rfq/new">
              <Button size="sm">+ 신규 견적</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-[var(--color-paper)]">
              <tr className="border-b border-[var(--color-hair)]">
                <th className="px-8 py-3 text-left font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">번호</th>
                <th className="px-3 py-3 text-left font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">제목</th>
                <th className="px-3 py-3 text-left font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">마감</th>
                <th className="px-3 py-3 text-left font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">PG수</th>
                <th className="px-3 py-3 text-right font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal">상태</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map((rfq, i) => (
                <tr
                  key={rfq.id}
                  ref={(el) => { rowRefs.current[i] = el; }}
                  onClick={() => router.push(`/rfq/${rfq.id}`)}
                  onMouseEnter={() => setActive(i)}
                  data-active={active === i}
                  className="group border-b border-[var(--color-hair)] hover:bg-[var(--color-paper-warm)] data-[active=true]:bg-[var(--color-paper-warm)] cursor-pointer transition-colors"
                >
                  <td className="relative px-8 py-4 font-mono text-[12px] tabular-nums text-[var(--color-ink-soft)] group-hover:before:absolute group-hover:before:left-0 group-hover:before:top-0 group-hover:before:bottom-0 group-hover:before:w-2 group-hover:before:bg-[var(--color-ink)] group-data-[active=true]:before:absolute group-data-[active=true]:before:left-0 group-data-[active=true]:before:top-0 group-data-[active=true]:before:bottom-0 group-data-[active=true]:before:w-2 group-data-[active=true]:before:bg-[var(--color-ink)]">
                    {rfq.id}
                  </td>
                  <td className="px-3 py-4 text-[13px] text-[var(--color-ink)] font-medium">{rfq.title}</td>
                  <td className="px-3 py-4 font-mono text-[12px] tabular-nums text-[var(--color-ink-muted)]">
                    {formatDate(rfq.deadline)}
                  </td>
                  <td className="px-3 py-4 font-mono text-[12px] tabular-nums text-[var(--color-ink-muted)]">
                    {rfq.allowedPgEmails.length}
                  </td>
                  <td className="px-3 py-4 text-right">
                    <Tag variant={statusVariant[rfq.status]}>{statusLabel[rfq.status]}</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-8 py-3 border-t border-[var(--color-hair)] flex items-center gap-4 font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-ink-faint)]">
            <span><kbd className="text-[var(--color-ink-soft)]">J</kbd> / <kbd className="text-[var(--color-ink-soft)]">K</kbd> 이동</span>
            <span><kbd className="text-[var(--color-ink-soft)]">Enter</kbd> 상세</span>
            <span><kbd className="text-[var(--color-ink-soft)]">⌘N</kbd> 신규</span>
          </div>
        </div>
      )}
    </div>
  );
}

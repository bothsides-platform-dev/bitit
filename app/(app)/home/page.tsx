import Link from 'next/link';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Tag } from '@/components/primitives/Tag';
import { Button } from '@/components/primitives/Button';
import { EmptyState } from '@/components/primitives/EmptyState';
import { PageEnter } from '@/components/primitives/PageEnter';
import { FileTextIcon } from '@/components/icons';
import { MOCK_RFQS } from '@/lib/mock/rfqs';
import { formatDate } from '@/lib/format';

export default function HomePage() {
  const sentRfqs = MOCK_RFQS.filter((r) => r.status === 'sent');

  return (
    <PageEnter className="px-8 py-10 max-w-[var(--content-max)]">
      {/* Greeting */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Eyebrow>BIDIT · BUYER DASHBOARD</Eyebrow>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
          <Eyebrow>2026.05.05</Eyebrow>
        </div>
        <h1
          className="text-[52px] font-[800] tracking-[-0.034em] leading-[1.1] text-[var(--color-ink)]"
        >
          안녕하세요,{' '}
          <span>이성연</span>
          <span className="font-[200]"> — 님.</span>
        </h1>
      </div>

      {/* Active RFQs */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Eyebrow>진행 중인 견적</Eyebrow>
          <span className="font-mono tabular-nums text-[11px] text-[var(--color-ink-soft)]">
            {sentRfqs.length}건
          </span>
        </div>
        {sentRfqs.length === 0 ? (
          <EmptyState
            icon={<FileTextIcon size={32} />}
            title="진행 중인 견적이 없습니다."
            description="새로운 견적을 작성해 PG사에 발송하세요."
            action={
              <Link href="/rfq/new">
                <Button size="sm">+ 신규 견적</Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
            {sentRfqs.map((rfq) => (
              <Link
                key={rfq.id}
                href={`/rfq/${rfq.id}`}
                className="py-4 flex items-center justify-between group hover:bg-[var(--color-paper-warm)] -mx-4 px-4 cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-ink)]">{rfq.title}</p>
                  <span className="font-mono text-[11px] text-[var(--color-ink-soft)] tabular-nums">
                    {rfq.id} · {formatDate(rfq.sentAt ?? rfq.createdAt)}
                  </span>
                </div>
                <Tag variant="amber">발송됨</Tag>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageEnter>
  );
}

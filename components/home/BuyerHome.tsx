import Link from 'next/link';
import { Label } from '@/components/primitives/Label';
import { Chip } from '@/components/primitives/Chip';
import { Button } from '@/components/primitives/Button';
import { EmptyState } from '@/components/primitives/EmptyState';
import { PageEnter } from '@/components/primitives/PageEnter';
import { FileTextIcon } from '@/components/icons';
import { KpiCell } from '@/components/primitives/KpiCell';
import { getRfqRepo } from '@/lib/server/repositories/factory';
import { formatDate } from '@/lib/format';

export async function BuyerHome({ workspaceId }: { workspaceId: string }) {
  const rfqs = await (await getRfqRepo()).findByBuyerWs(workspaceId);
  const sentRfqs = rfqs.filter((r) => r.status === 'sent');
  const awardedRfqs = rfqs.filter((r) => r.status === 'awarded');

  return (
    <PageEnter className="px-8 py-10">
      {/* KPI Strip */}
      <div className="flex items-start gap-16 mb-12 pb-12 border-b border-[var(--color-hair)]">
        <KpiCell label="전체 견적" value={String(rfqs.length)} />
        <KpiCell label="진행 중" value={String(sentRfqs.length)} />
        <KpiCell label="수주 완료" value={String(awardedRfqs.length)} />
      </div>

      {/* Active RFQs */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Label size="md" muted={false}>진행 중인 견적</Label>
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
                className="relative py-4 flex items-center justify-between group hover:bg-[var(--color-paper-warm)] -mx-4 px-4 cursor-pointer transition-colors before:absolute before:left-0 before:top-0 before:bottom-0 before:w-2 before:bg-[var(--color-ink)] before:opacity-0 hover:before:opacity-100 before:transition-opacity"
              >
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-ink)]">
                    {rfq.title}
                  </p>
                  <span className="font-mono text-[11px] text-[var(--color-ink-soft)] tabular-nums">
                    {rfq.id} · {formatDate(rfq.sentAt ?? rfq.createdAt)}
                  </span>
                </div>
                <Chip label="발송됨" color="warning" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageEnter>
  );
}

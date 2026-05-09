import Link from 'next/link';
import { PageEnter } from '@/components/primitives/PageEnter';
import { KpiCell } from '@/components/primitives/KpiCell';
import { Label } from '@/components/primitives/Label';
import { EmptyState } from '@/components/primitives/EmptyState';
import { InboxIcon } from '@/components/icons';
import { getInvitationRepo, getBidRepo } from '@/lib/server/repositories/factory';
import { GRADE_LABELS } from '@/lib/types/biz-profile';
import { formatDeadline, formatDate } from '@/lib/format';
import { computePgHomeData } from '@/lib/server/pg-home';

const stageLabel: Record<'won' | 'lost' | 'pending', string> = {
  won: '[ 수주 ]',
  lost: '[ 미선정 ]',
  pending: '[ 검토중 ]',
};

const stageColor: Record<'won' | 'lost' | 'pending', string> = {
  won: 'text-[var(--md-sys-color-tertiary)]',
  lost: 'text-[var(--md-sys-color-on-surface-variant)]',
  pending: 'text-[var(--md-sys-color-on-surface-variant)]',
};

export async function PgHome({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId: string;
}) {
  const [invRepo, bidRepo] = await Promise.all([getInvitationRepo(), getBidRepo()]);
  const [pairs, bids] = await Promise.all([
    invRepo.findByPgUser(userId),
    bidRepo.findByPgWs(workspaceId),
  ]);

  const { kpi, pendingPairs, recentBids } = computePgHomeData(pairs, bids);

  return (
    <PageEnter className="px-8 py-10">
      {/* KPI Strip */}
      <div className="flex items-start gap-16 mb-12 pb-12 border-b border-[var(--md-sys-color-outline-variant)]">
        <KpiCell label="전체 수신" value={String(kpi.total)} />
        <KpiCell label="응답 대기" value={String(kpi.pending)} />
        <KpiCell label="제출 완료" value={String(kpi.submitted)} />
        <KpiCell label="수주" value={String(kpi.won)} />
      </div>

      {/* 2-column list */}
      <div className="grid grid-cols-2 gap-10">
        {/* Left: 응답 대기 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Label size="md" muted={false}>응답 대기</Label>
            <span className="font-mono tabular-nums text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              {kpi.pending}건
            </span>
          </div>
          {pendingPairs.length === 0 ? (
            <EmptyState
              icon={<InboxIcon size={24} />}
              title="응답 대기 중인 견적이 없습니다."
              description="구매사가 초대한 RFQ가 /inbox에 표시됩니다."
            />
          ) : (
            <div className="border-t border-[var(--md-sys-color-outline-variant)]">
              {pendingPairs.map((p) => {
                const dday = formatDeadline(p.rfq.deadline);
                const urgent =
                  dday === '마감' ||
                  (dday.startsWith('D-') && parseInt(dday.slice(2), 10) <= 3);
                const grade = p.rfq.bizProfile?.grade
                  ? GRADE_LABELS[p.rfq.bizProfile.grade]
                  : '—';
                return (
                  <Link
                    key={p.invitation.id}
                    href={`/inbox/${p.rfq.id}`}
                    className="relative flex items-center justify-between py-3 border-b border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] -mx-4 px-4 transition-colors before:absolute before:left-0 before:top-0 before:bottom-0 before:w-2 before:bg-[var(--md-sys-color-on-surface)] before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-[var(--md-sys-color-on-surface)]">
                        {p.rfq.title}
                      </p>
                      <span className="font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular-nums">
                        {p.rfq.id} · {grade}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[11px] tabular-nums font-medium ${
                        urgent
                          ? 'text-[var(--md-sys-color-error)]'
                          : 'text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      {dday}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: 최근 제출 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Label size="md" muted={false}>최근 제출</Label>
            <span className="font-mono tabular-nums text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              최근 3건
            </span>
          </div>
          {recentBids.length === 0 ? (
            <EmptyState
              icon={<InboxIcon size={24} />}
              title="제출한 견적이 없습니다."
            />
          ) : (
            <div className="border-t border-[var(--md-sys-color-outline-variant)]">
              {recentBids.map(({ bid, rfqTitle, stage }) => (
                <Link
                  key={bid.id}
                  href={`/inbox/${bid.rfqId}`}
                  className="relative flex items-center justify-between py-3 border-b border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] -mx-4 px-4 transition-colors before:absolute before:left-0 before:top-0 before:bottom-0 before:w-2 before:bg-[var(--md-sys-color-on-surface)] before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  <div>
                    <p className="text-[13px] font-medium text-[var(--md-sys-color-on-surface)]">
                      {rfqTitle}
                    </p>
                    <span className="font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular-nums">
                      {bid.rfqId} · {formatDate(bid.submittedAt!)}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[11px] tracking-[0.06em] ${stageColor[stage]}`}
                  >
                    {stageLabel[stage]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageEnter>
  );
}

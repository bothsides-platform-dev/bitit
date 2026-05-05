import { Tag } from '@/components/primitives/Tag';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { EmptyState } from '@/components/primitives/EmptyState';
import { MOCK_INVITATIONS } from '@/lib/mock/invitations';
import { MOCK_RFQS } from '@/lib/mock/rfqs';
import { GRADE_LABELS } from '@/lib/mock/biz-lookup';
import { MOCK_SESSION_PG } from '@/lib/mock/workspaces';
import { formatDeadline } from '@/lib/format';
import { InboxIcon } from '@/components/icons';
import Link from 'next/link';

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
  const myInvitations = MOCK_INVITATIONS.filter(
    (inv) => inv.acceptedByUserId === MOCK_SESSION_PG.userId || inv.status === 'sent',
  );

  const rows = myInvitations
    .map((inv) => {
      const rfq = MOCK_RFQS.find((r) => r.id === inv.rfqId);
      return rfq ? { inv, rfq } : null;
    })
    .filter(Boolean) as { inv: typeof myInvitations[0]; rfq: typeof MOCK_RFQS[0] }[];

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
              {rows.map(({ inv, rfq }) => {
                const daysLeft = formatDeadline(rfq.deadline);
                const isUrgent = daysLeft.startsWith('D-') && parseInt(daysLeft.slice(2)) <= 3;
                return (
                  <Link key={inv.id} href={`/inbox/${rfq.id}`} legacyBehavior>
                    <tr className="group border-b border-[var(--color-hair)] hover:bg-[var(--color-paper-warm)] cursor-pointer transition-colors">
                      <td className="relative px-8 py-4 font-mono text-[12px] tabular-nums text-[var(--color-ink-soft)] group-hover:before:absolute group-hover:before:left-0 group-hover:before:top-0 group-hover:before:bottom-0 group-hover:before:w-2 group-hover:before:bg-[var(--color-ink)]">
                        {rfq.id}
                      </td>
                      <td className="px-3 py-4 text-[13px] text-[var(--color-ink)] font-medium">{rfq.title}</td>
                      <td className="px-3 py-4 text-[13px] text-[var(--color-ink-muted)]">{rfq.bizProfile.name}</td>
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
                  </Link>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Label } from '@/components/primitives/Label';
import { Chip, type ChipColor } from '@/components/primitives/Chip';
import { Button } from '@/components/primitives/Button';
import { PageEnter } from '@/components/primitives/PageEnter';
import { BidComparisonView } from '@/components/rfq/BidComparisonView';
import { RfqInviteManager } from '@/components/rfq/RfqInviteManager';
import { auth } from '@/auth';
import {
  getBidRepo,
  getInvitationRepo,
  getRfqRepo,
  getWorkspaceRepo,
} from '@/lib/server/repositories/factory';
import { baseUrl } from '@/lib/server/actions/auth/_shared';
import type { InvitationStatus } from '@/lib/types/invitation';
import { STATUTORY_CARD_FEE } from '@/lib/types/bid';
import { GRADE_LABELS } from '@/lib/types/biz-profile';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

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

type Props = { params: Promise<{ id: string }> };

export default async function RfqDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id || session.user.workspaceType !== 'buyer') {
    redirect(`/login?next=/rfq/${id}`);
  }

  const rfq = await (await getRfqRepo()).findById(id);
  if (!rfq || rfq.buyerWsId !== session.user.workspaceId) {
    return (
      <div className="px-8 py-8">
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
          RFQ를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  const allBids = await (await getBidRepo()).findByRfq(id);
  const rfqBids = allBids.filter((b) => b.status === 'submitted');

  const wsRepo = await getWorkspaceRepo();
  const ws = await wsRepo.findById(rfq.buyerWsId);
  const companyName = ws?.name ?? '—';

  // Invitation status per email — `allowedPgEmails`를 source of truth로 두고
  // 매칭되는 invitation row의 status를 매핑. addPgEmailsToRfqAction이 row를
  // 생성하므로 미발송 PG도 'draft' 상태로 표시된다.
  const invitations = await (await getInvitationRepo()).findByRfq(id);
  const invByEmail = new Map<string, InvitationStatus>();
  for (const inv of invitations) {
    invByEmail.set(inv.pgEmail.toLowerCase(), inv.status);
  }
  const inviteList = rfq.allowedPgEmails.map((email) => ({
    email,
    status: invByEmail.get(email.toLowerCase()) ?? ('sent' as InvitationStatus),
  }));

  // RSC는 매 요청마다 재실행되므로 시계 접근이 필요하다 — purity 룰은 클라이언트
  // 컴포넌트의 안정성을 위한 것이라 RSC에는 해당하지 않음.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const canEdit =
    rfq.status === 'sent' && new Date(rfq.deadline).getTime() > nowMs;
  const shareUrl = rfq.shareToken
    ? `${baseUrl()}/share/rfq/${rfq.shareToken}`
    : '';

  // pgWsId → name map. dedup 후 parallel fetch — RFQ 당 PG 수가 작아(≤10) 직접 N
  // 회 호출도 안전하지만, Set으로 중복 제거 + Promise.all 병렬화가 정석 형태.
  const pgWsIds = Array.from(new Set(rfqBids.map((b) => b.pgWsId)));
  const pgWorkspaces = await Promise.all(pgWsIds.map((pgId) => wsRepo.findById(pgId)));
  const pgWsNameMap: Record<string, string> = {};
  pgWorkspaces.forEach((w, i) => {
    if (w) pgWsNameMap[pgWsIds[i]] = w.name;
  });

  const bizProfile = rfq.bizProfile;
  const cardFee = bizProfile?.grade ? STATUTORY_CARD_FEE[bizProfile.grade] : NaN;

  return (
    <PageEnter className="px-8 py-8 space-y-10">
      {/* Header */}
      <div>
        <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-soft)]">
          {rfq.id}
        </span>
        <div className="flex items-start justify-between mt-1 gap-4">
          <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
            {rfq.title}
          </h1>
          <div className="flex items-center gap-3 shrink-0">
            <Chip label={statusLabel[rfq.status]} color={statusColor[rfq.status]} />
            {rfq.status === 'sent' && rfqBids.length > 0 && (
              <Link href={`/rfq/${id}/award`}>
                <Button size="sm">수주 처리 →</Button>
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <Label size="md" muted={false}>마감 {formatDate(rfq.deadline)}</Label>
          <span className="text-[var(--color-hair-strong)]">·</span>
          <Label size="md" muted={false}>PG {rfq.allowedPgEmails.length}개사</Label>
          <span className="text-[var(--color-hair-strong)]">·</span>
          <Label size="md" muted={false}>받은 견적 {rfqBids.length}건</Label>
        </div>
      </div>

      {/* Comparison table */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">
            견적 비교
          </span>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <BidComparisonView
          rfqId={id}
          bids={rfqBids}
          grade={bizProfile?.grade}
          rfqStatus={rfq.status}
          awardedBidId={rfq.awardedBidId}
          pgWsNameMap={pgWsNameMap}
          authorId={session.user.id}
          authorName={session.user.name ?? session.user.email ?? '구매사 담당자'}
        />
      </section>

      {/* Meta sidebar */}
      <div className="grid grid-cols-2 gap-10 border-t border-[var(--color-hair)] pt-8">
        {/* Biz info */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <Label size="md" muted={false}>사업자 정보</Label>
            <div className="flex-1 h-px bg-[var(--color-hair)]" />
          </div>
          <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
            {[
              ['상호명', companyName],
              ['사업자번호', bizProfile?.bizNo ?? '미입력'],
              ...(bizProfile?.grade
                ? [
                    ['등급', GRADE_LABELS[bizProfile.grade]],
                    [
                      '카드',
                      Number.isNaN(cardFee)
                        ? '카드사별 협의'
                        : `${(cardFee * 100).toFixed(2)}%`,
                    ],
                  ]
                : [['등급', '미정']]),
            ].map(([label, value]) => (
              <div
                key={label}
                className="py-2 flex items-baseline justify-between"
              >
                <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">
                  {label}
                </span>
                <span className="text-[13px] text-[var(--color-ink)]">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* PG list + memo */}
        <section className="space-y-6">
          <RfqInviteManager
            rfqId={id}
            invitations={inviteList}
            shareUrl={shareUrl}
            canEdit={canEdit}
          />
          {rfq.memo && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Label size="md" muted={false}>메모</Label>
                <div className="flex-1 h-px bg-[var(--color-hair)]" />
              </div>
              <p className="text-[13px] text-[var(--color-ink-muted)] leading-relaxed whitespace-pre-wrap">
                {rfq.memo}
              </p>
            </div>
          )}
        </section>
      </div>
    </PageEnter>
  );
}

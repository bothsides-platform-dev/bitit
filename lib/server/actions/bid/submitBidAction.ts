'use server';

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';

import { requirePgSession } from '@/lib/auth/session';
import { workspaceMembers, users, workspaces } from '@/lib/db/schema';
import {
  getAttachmentRepo,
  getBidRepo,
  getInvitationRepo,
  getOutboxRepo,
  getRfqRepo,
} from '@/lib/server/repositories/factory';
import {
  dispatchNotification,
  emitAfterCommit,
} from '@/lib/server/notifications/dispatch';
import { renderBidSubmitted } from '@/lib/server/outbox/templates/bidSubmitted';
import { flushAfterCommit } from '@/lib/server/outbox/post-commit';
import type { Bid, CardIssuer } from '@/lib/types/bid';
import type { Notification } from '@/lib/types/notification';
import { actionDb, type BidActionResult } from './_shared';

const CardIssuerEnum = z.enum([
  'BC',
  'SHINHAN',
  'SAMSUNG',
  'HYUNDAI',
  'KB',
  'LOTTE',
  'NH',
  'HANA',
  'WOORI',
]);

const Input = z
  .object({
    rfqId: z.string().min(1),
    settleCycle: z.enum(['D+0', 'D+1', 'D+2', 'weekly', 'monthly']),
    deposit: z.number().nonnegative(),
    setupFee: z.number().nonnegative(),
    monthlyMin: z.number().nonnegative(),
    bankTransferFeePct: z.number().min(0).max(1),
    easyPayFeePct: z.number().min(0).max(1),
    cardFeesByIssuer: z.record(CardIssuerEnum, z.number().min(0).max(1)).optional(),
    overseasCardFeePct: z.number().min(0).max(1).optional(),
    proposalAttachmentId: z.string().uuid().optional(),
    memo: z.string().max(2000).optional(),
  })
  .strict();

export type SubmitBidInput = z.input<typeof Input>;
export type SubmitBidResult = BidActionResult<{ bidId: string }>;

/**
 * PG 견적 제출.
 *
 * 트랜잭션 단계:
 *   1) requirePgSession — workspace_type='pg' 게이트.
 *   2) zod 검증.
 *   3) **canAccess 가드 (advisor pin 2)**: invitation.acceptedByUserId === session.user.id.
 *      도메인 동료가 같은 RFQ에 입찰 차단.
 *   4) RFQ + 스냅샷 BizProfile 조회 → grade 추출.
 *   5) **STATUTORY_CARD_FEE 서버 강제 (advisor pin 1)**:
 *      grade !== 'general' 이면 cardFeesByIssuer = null. 영세/중소 1~3은 법정 고정.
 *   6) invitation 조회 → invitationId 픽업.
 *   7) BidRepo.save (id 호출자 발급) — UNIQUE(rfqId, pgWsId) 위반은 'BID_ALREADY_SUBMITTED'.
 *   8) buyer ws 멤버 each → notifications.in_app + outbox.bid.submitted.
 */
export async function submitBidAction(
  input: SubmitBidInput,
): Promise<SubmitBidResult> {
  let session;
  try {
    session = await requirePgSession();
  } catch {
    return { ok: false, error: 'FORBIDDEN_PG' };
  }

  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const data = parsed.data;
  const userId = session.user.id;
  const pgWsId = session.user.workspaceId;

  // canAccess 가드 — 액션 레이어 1차 방어.
  const invRepo = await getInvitationRepo();
  const ok = await invRepo.canAccess(data.rfqId, userId);
  if (!ok) return { ok: false, error: 'FORBIDDEN' };

  const rfqRepo = await getRfqRepo();
  const rfq = await rfqRepo.findById(data.rfqId);
  if (!rfq) return { ok: false, error: 'RFQ_NOT_FOUND' };
  if (rfq.status !== 'sent') return { ok: false, error: 'RFQ_NOT_OPEN' };

  // STATUTORY_CARD_FEE 서버 강제 (advisor pin 1):
  // grade 가 영세/중소1~3 인 경우 cardFeesByIssuer 입력은 무시되고 null 로 강제.
  // 일반(general) 또는 등급 미입력(NULL) 일 때만 클라이언트 입력 채택 — 등급 미입력
  // RFQ 는 PG 가 일반 등급 가정으로 9개 카드사 직접 견적.
  const grade = rfq.bizProfile?.grade ?? null;
  const allowCardFees = grade === null || grade === 'general';
  const cardFees = allowCardFees ? (data.cardFeesByIssuer ?? null) : null;
  const overseasCardFeePct = allowCardFees
    ? (data.overseasCardFeePct ?? undefined)
    : undefined;

  // 호출자 invitation row 픽업 — bid.invitationId FK.
  const allInvs = await invRepo.findByRfq(data.rfqId);
  const myInv = allInvs.find((i) => i.acceptedByUserId === userId);
  if (!myInv) return { ok: false, error: 'INVITATION_NOT_FOUND' };

  // proposalAttachmentId가 있다면 본인 업로드인지 강제(advisor pin: 다른
  // PG의 attachment id로 자기 견적을 만드는 spoofing 방지). canAccess는
  // 같은 RFQ에 초대된 다른 PG도 통과시키므로 별도 ownership 체크 필요.
  if (data.proposalAttachmentId) {
    const att = await (await getAttachmentRepo()).findById(
      data.proposalAttachmentId,
    );
    if (
      !att ||
      att.uploadedBy !== userId ||
      att.ownerKind !== 'bid_proposal' ||
      att.ownerId !== data.rfqId
    ) {
      return { ok: false, error: 'INVALID_ATTACHMENT' };
    }
  }

  const db = actionDb();
  const bidId = randomUUID();
  const now = new Date();

  // UNIQUE(rfqId, pgWsId) 사전 검사 — pglite는 23505가 트랜잭션을 abort 시키므로
  // try/catch 후 commit이 불가능. 트랜잭션 진입 전 1회 read-check로 막고,
  // 동시성 race로 들어온 두 번째 요청은 트랜잭션 안에서 try/catch + 재throw.
  // (advisor pin 4: withdrawn 행이 있어도 재시도 차단 — 같은 단순화 흐름.)
  const bidRepo = await getBidRepo();
  const existingBids = await bidRepo.findByRfq(data.rfqId);
  if (existingBids.some((b) => b.pgWsId === pgWsId)) {
    return { ok: false, error: 'BID_ALREADY_SUBMITTED' };
  }

  const pendingEmits: Notification[] = [];

  const result: SubmitBidResult = await db.transaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (tx: any): Promise<SubmitBidResult> => {
      const bid: Bid = {
        id: bidId,
        rfqId: data.rfqId,
        pgWsId,
        invitationId: myInv.id,
        settleCycle: data.settleCycle,
        deposit: data.deposit,
        setupFee: data.setupFee,
        monthlyMin: data.monthlyMin,
        bankTransferFeePct: data.bankTransferFeePct,
        easyPayFeePct: data.easyPayFeePct,
        cardFeesByIssuer: (cardFees ?? undefined) as
          | Record<CardIssuer, number>
          | undefined,
        overseasCardFeePct,
        proposalPdf: data.proposalAttachmentId
          ? {
              id: data.proposalAttachmentId,
              name: '',
              size: 0,
              mimeType: 'application/pdf',
              url: '',
            }
          : { id: '', name: '', size: 0, mimeType: 'application/pdf', url: '' },
        memo: data.memo,
        status: 'submitted',
        submittedBy: userId,
        submittedAt: now.toISOString(),
      };

      // race-window 동시성 시 23505 — tx abort 되어 catch 후 commit 불가능.
      // 트랜잭션 외부 사전 check로 99% 케이스를 흡수했고, race 시에는 throw로
      // 자연 rollback. 호출자가 재시도 시 사전 check가 다시 걸려 BID_ALREADY_SUBMITTED.
      await bidRepo.save(bid, tx);

      // 알림 (advisor pin 6): buyer ws 전 멤버에게 인앱 + 메일 모두.
      const buyerMembers = (await tx
        .select({ userId: workspaceMembers.userId, email: users.email })
        .from(workspaceMembers)
        .innerJoin(users, eq(workspaceMembers.userId, users.id))
        .where(eq(workspaceMembers.workspaceId, rfq.buyerWsId))) as {
        userId: string;
        email: string;
      }[];

      // PG ws name (이메일 본문에 표시).
      const [pgWsRow] = (await tx
        .select({ name: workspaces.name, domain: workspaces.domain })
        .from(workspaces)
        .where(eq(workspaces.id, pgWsId))
        .limit(1)) as { name: string; domain: string | null }[];
      const pgWsLabel = pgWsRow?.name ?? pgWsRow?.domain ?? 'PG';

      const outbox = await getOutboxRepo();

      // 같은 RFQ × pgWs 조합의 메일 본문은 모든 buyer 멤버에게 동일 — 한 번만
      // 렌더해 재사용.
      const submittedHtml = await renderBidSubmitted({
        rfqId: data.rfqId,
        rfqTitle: rfq.title,
        pgName: pgWsLabel,
        submittedAt: now.toISOString().replace('T', ' ').slice(0, 16),
      });

      for (const m of buyerMembers) {
        const notif: Notification = {
          id: randomUUID(),
          userId: m.userId,
          workspaceId: rfq.buyerWsId,
          type: 'bid.submitted',
          title: `[${data.rfqId}] ${pgWsLabel} 견적 도착`,
          body: `${pgWsLabel}가 견적을 제출했습니다.`,
          channel: 'inapp',
          status: 'pending',
          linkUrl: `/rfq/${data.rfqId}`,
          createdAt: now.toISOString(),
        };
        await dispatchNotification(tx, notif);
        pendingEmits.push(notif);
        await outbox.enqueue(
          {
            event: 'bid.submitted',
            to: m.email,
            subject: `[BIDIT · ${data.rfqId}] ${pgWsLabel} 견적 도착`,
            html: submittedHtml,
            // 멤버별 dedupe — 같은 멤버 중복 enqueue를 collapse.
            dedupeKey: `bid:${data.rfqId}:${pgWsId}:${m.userId}`,
          },
          tx,
        );
      }

      return { ok: true, bidId };
    },
  );

  if (result.ok) {
    emitAfterCommit(pendingEmits);
    flushAfterCommit();
  }
  return result;
}

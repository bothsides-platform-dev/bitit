'use server';

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';

import { requireBuyerSession } from '@/lib/auth/session';
import {
  bizProfiles,
  rfqInvitations,
  rfqs,
  workspaces,
} from '@/lib/db/schema';
import {
  getOutboxRepo,
  getInvitationRepo,
} from '@/lib/server/repositories/factory';
import { nextRfqId } from '@/lib/server/rfq-id';
import { addMinutes, generateToken } from '@/lib/server/token';
import {
  actionDb,
  baseUrl,
  devLogRfqInviteLink,
  type RfqActionResult,
} from './_shared';

const Input = z
  .object({
    title: z.string().min(1).max(200),
    memo: z.string().max(2000).optional(),
    deadline: z.string().min(1), // ISO timestamp
    allowedPgEmails: z.array(z.string().email()).min(1).max(50),
    rfpAttachmentIds: z.array(z.string().uuid()).optional(),
    gradeOverride: z
      .enum(['small', 'sme1', 'sme2', 'sme3', 'general'])
      .optional(),
    send: z.boolean().optional().default(false),
  })
  .strict();

// Public input (callers): `send` 는 zod default 덕에 생략 가능.
// `z.input` 으로 노출해서 caller가 `send`를 안 적어도 컴파일되게 한다.
export type CreateRfqInput = z.input<typeof Input>;
export type CreateRfqResult = RfqActionResult<{ rfqId: string }>;

const INVITE_TTL_DAYS = 7;

/**
 * RFQ 생성. send=false면 draft 저장, send=true면 sent + invitation/outbox 일괄.
 *
 * 트랜잭션 단계 (advisor pin 1: workspace.biz_profile_id 절대 변경 금지):
 *   1) `nextRfqId(tx)` 로 ID 발급
 *   2) workspace 행에서 현재 bizProfileId 조회 → 그 row 를 읽어
 *      gradeOverride 적용 후 **새 biz_profiles row insert (RFQ 스냅샷)**
 *   3) `rfqs` insert — `bizProfileId = 새 스냅샷 id`. status는 send에 따라
 *      'sent'/'draft', sentAt도 그에 따라 now() 또는 null
 *   4) **workspace.biz_profile_id 는 그대로 둔다** — RFQ 시점 스냅샷이지
 *      workspace 업데이트가 아님. workspace 갱신은
 *      `updateWorkspaceBizProfileAction` 전용
 *   5) send=true 면 추가:
 *        - rfq_invitations N개 insert + InvitationRepo.save (token hash 저장)
 *        - rfq.invited 아웃박스 N개 (dedupe rfq:{id}:invite:{email})
 *        - rfq.sent 아웃박스 1개 (buyer 본인용 alert, dedupe rfq:{id}:sent)
 *        - dev 콘솔에 invite URL 출력 (Step 10에서 줄 제거)
 */
export async function createRfqAction(
  input: CreateRfqInput,
): Promise<CreateRfqResult> {
  let session;
  try {
    session = await requireBuyerSession();
  } catch {
    return { ok: false, error: 'FORBIDDEN_BUYER' };
  }

  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const wsId = session.user.workspaceId;
  const userId = session.user.id;
  const send = parsed.data.send;
  const db = actionDb();

  return await db.transaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (tx: any): Promise<CreateRfqResult> => {
      // 1. RFQ id 발급 (atomic counter)
      const rfqId = await nextRfqId(tx);

      // 2. workspace의 현재 biz_profile_id 조회 (advisor pin 2: hydrated
      //    Workspace 타입이 아니라 raw 컬럼 직접 read)
      const [wsRow] = await tx
        .select({ bizProfileId: workspaces.bizProfileId })
        .from(workspaces)
        .where(eq(workspaces.id, wsId))
        .limit(1);
      if (!wsRow || !wsRow.bizProfileId) {
        return { ok: false, error: 'WORKSPACE_BIZ_PROFILE_MISSING' };
      }
      const [currentBiz] = await tx
        .select()
        .from(bizProfiles)
        .where(eq(bizProfiles.id, wsRow.bizProfileId))
        .limit(1);
      if (!currentBiz) {
        return { ok: false, error: 'WORKSPACE_BIZ_PROFILE_MISSING' };
      }

      // 3. RFQ별 immutable 스냅샷 row insert. gradeOverride가 있으면 grade를
      //    덮어쓰고 source/confirm 메타를 사용자 식별로 업데이트.
      const snapshotId = randomUUID();
      const now = new Date();
      const overrideGrade = parsed.data.gradeOverride;
      await tx.insert(bizProfiles).values({
        id: snapshotId,
        bizNo: currentBiz.bizNo,
        taxType: currentBiz.taxType,
        status: currentBiz.status,
        grade: overrideGrade ?? currentBiz.grade ?? null,
        gradeSource: overrideGrade
          ? 'user_overridden'
          : currentBiz.gradeSource,
        gradeConfirmedBy: overrideGrade
          ? userId
          : (currentBiz.gradeConfirmedBy ?? null),
        gradeConfirmedAt: overrideGrade
          ? now
          : (currentBiz.gradeConfirmedAt ?? null),
      });

      // 4. NOTE: workspace.biz_profile_id 는 건드리지 않음.
      //    (RFQ 시점 스냅샷일 뿐, workspace 시점 갱신은 updateWorkspaceBizProfileAction 전용)

      // 5. rfqs insert
      await tx.insert(rfqs).values({
        id: rfqId,
        buyerWsId: wsId,
        bizProfileId: snapshotId,
        title: parsed.data.title.trim(),
        memo: parsed.data.memo?.trim() ?? '',
        allowedPgEmails: parsed.data.allowedPgEmails,
        deadline: new Date(parsed.data.deadline),
        status: send ? 'sent' : 'draft',
        createdBy: userId,
        sentAt: send ? now : null,
      });

      // 6. send 분기 — invitation N + outbox N + 1
      if (send) {
        const invitationsRepo = await getInvitationRepo();
        const outbox = await getOutboxRepo();
        const expiresAt = addMinutes(now, INVITE_TTL_DAYS * 24 * 60);

        for (const email of parsed.data.allowedPgEmails) {
          const rawToken = generateToken();
          const invId = randomUUID();
          await invitationsRepo.save(
            {
              id: invId,
              rfqId,
              pgEmail: email,
              uniqueToken: '',
              sentAt: now.toISOString(),
              expiresAt,
              status: 'sent',
            },
            rawToken,
            tx,
          );
          const inviteUrl = `${baseUrl()}/invite/rfq/${rawToken}`;
          // Step 10 cleanup: remove this devLogRfqInviteLink line once Resend
          // sender lands so dev no longer needs the console fallback.
          devLogRfqInviteLink(inviteUrl, email);
          await outbox.enqueue(
            {
              event: 'rfq.invited',
              to: email,
              // Step 10에서 react-email 템플릿으로 교체.
              subject: `[RFQ ${rfqId}] 견적 요청 도착`,
              html: `<a href="${inviteUrl}">초대 수락하기</a>`,
              dedupeKey: `rfq:${rfqId}:invite:${email}`,
            },
            tx,
          );
        }

        // buyer 본인 발송 알림 (in-app은 Step 9 SSE 시점에 추가, 지금은 outbox만).
        await outbox.enqueue(
          {
            event: 'rfq.sent',
            to: session.user.email ?? '',
            subject: `[RFQ ${rfqId}] 발송 완료`,
            html: `<p>${parsed.data.title.trim()} 견적이 ${parsed.data.allowedPgEmails.length}개 PG사에 발송되었습니다.</p>`,
            dedupeKey: `rfq:${rfqId}:sent`,
          },
          tx,
        );
      }

      // 빠른 확인: 같은 tx에서 invitation row 추가가 hashToken UNIQUE
      // (`token_hash`) 충돌 시 throw — 여기까지 도달했다면 모두 성공.
      void rfqInvitations; // tree-shaken 방지 (schema reference)

      return { ok: true, rfqId };
    },
  );
}

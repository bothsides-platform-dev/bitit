'use server';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';

import { requireBuyerSession } from '@/lib/auth/session';
import {
  rfqInvitations,
  rfqs,
  workspaceMembers,
  workspaces,
} from '@/lib/db/schema';
import { getOutboxRepo } from '@/lib/server/repositories/factory';
import { generateToken, hashToken } from '@/lib/server/token';
import { renderRfqInvited } from '@/lib/server/outbox/templates/rfqInvited';
import { flushAfterCommit } from '@/lib/server/outbox/post-commit';
import {
  dispatchNotification,
  emitAfterCommit,
} from '@/lib/server/notifications/dispatch';
import type { Notification } from '@/lib/types/notification';
import { emailDomain } from '@/lib/server/actions/auth/_shared';
import {
  actionDb,
  baseUrl,
  type RfqActionResult,
} from './_shared';

const Input = z
  .object({
    rfqId: z.string().regex(/^Q-\d{4}-\d{4}$/),
  })
  .strict();

export type SendDraftInvitationsInput = z.input<typeof Input>;
export type SendDraftInvitationsResult = RfqActionResult<{ sentCount: number }>;

/**
 * `addPgEmailsToRfqAction`이 누적해둔 `'draft'` invitation row 일괄 발송.
 *
 * 흐름:
 *   1. 권한 + RFQ open 가드(status='sent' && deadline > now).
 *   2. draft 행 select.
 *   3. 각 행마다 fresh rawToken 발급 → tokenHash 갱신 + status='pending'(DB)
 *      → outbox enqueue. dedupeKey는 createRfqAction과 동일 패턴
 *      `rfq:{rfqId}:invite:{email}` — case-insensitive 부분 unique index가
 *      "같은 이메일 두 번 추가" race를 차단하므로 dedupe 충돌은 정상 케이스에서
 *      발생하지 않음.
 *   4. post-commit flush.
 */
export async function sendDraftInvitationsAction(
  input: SendDraftInvitationsInput,
): Promise<SendDraftInvitationsResult> {
  let session;
  try {
    session = await requireBuyerSession();
  } catch {
    return { ok: false, error: 'FORBIDDEN_BUYER' };
  }

  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const wsId = session.user.workspaceId;
  const db = actionDb();

  const pendingEmits: Notification[] = [];

  const result = await db.transaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (tx: any): Promise<SendDraftInvitationsResult> => {
      const [rfqRow] = await tx
        .select({
          id: rfqs.id,
          buyerWsId: rfqs.buyerWsId,
          status: rfqs.status,
          deadline: rfqs.deadline,
          title: rfqs.title,
        })
        .from(rfqs)
        .where(eq(rfqs.id, parsed.data.rfqId))
        .limit(1);
      if (!rfqRow) return { ok: false, error: 'NOT_FOUND' };
      if (rfqRow.buyerWsId !== wsId) return { ok: false, error: 'NOT_OWNED' };
      if (rfqRow.status !== 'sent') return { ok: false, error: 'RFQ_NOT_OPEN' };
      if (new Date(rfqRow.deadline).getTime() <= Date.now()) {
        return { ok: false, error: 'RFQ_DEADLINE_PASSED' };
      }

      const drafts = await tx
        .select()
        .from(rfqInvitations)
        .where(
          and(
            eq(rfqInvitations.rfqId, parsed.data.rfqId),
            eq(rfqInvitations.status, 'draft'),
          ),
        );
      if (drafts.length === 0) {
        return { ok: true, sentCount: 0 };
      }

      const [wsRow] = await tx
        .select({ name: workspaces.name })
        .from(workspaces)
        .where(eq(workspaces.id, wsId))
        .limit(1);
      const buyerName = wsRow?.name ?? '구매사';
      const deadlineDisplay = new Date(rfqRow.deadline)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 16);
      const outbox = await getOutboxRepo();

      const now = new Date();
      const draftEmails = (drafts as { pgEmail: string }[]).map(
        (d) => d.pgEmail,
      );
      const pgDomains = Array.from(
        new Set(
          draftEmails
            .map((e) => emailDomain(e))
            .filter((d): d is string => d !== null),
        ),
      );
      const pgWsRows =
        pgDomains.length > 0
          ? ((await tx
              .select({ id: workspaces.id })
              .from(workspaces)
              .where(
                and(
                  eq(workspaces.type, 'pg'),
                  inArray(workspaces.domain, pgDomains),
                ),
              )) as { id: string }[])
          : [];
      for (const ws of pgWsRows) {
        const members = (await tx
          .select({ userId: workspaceMembers.userId })
          .from(workspaceMembers)
          .where(eq(workspaceMembers.workspaceId, ws.id))) as {
          userId: string;
        }[];
        for (const m of members) {
          const notif: Notification = {
            id: randomUUID(),
            userId: m.userId,
            workspaceId: ws.id,
            type: 'rfq.invited',
            title: `[${rfqRow.id}] 견적 요청 도착`,
            body: `${buyerName}가 견적을 요청했습니다.`,
            channel: 'inapp',
            status: 'pending',
            linkUrl: `/inbox/${rfqRow.id}`,
            createdAt: now.toISOString(),
          };
          await dispatchNotification(tx, notif);
          pendingEmits.push(notif);
        }
      }

      let sentCount = 0;
      for (const draft of drafts) {
        const rawToken = generateToken();
        await tx
          .update(rfqInvitations)
          .set({
            tokenHash: hashToken(rawToken),
            status: 'pending',
            sentAt: new Date(),
          })
          .where(eq(rfqInvitations.id, draft.id));

        const inviteUrl = `${baseUrl()}/invite/rfq/${rawToken}`;
        const html = await renderRfqInvited({
          rfqId: rfqRow.id,
          rfqTitle: rfqRow.title,
          buyerName,
          deadline: deadlineDisplay,
          inviteUrl,
        });
        await outbox.enqueue(
          {
            event: 'rfq.invited',
            to: draft.pgEmail,
            subject: `[BIDIT · ${rfqRow.id}] 견적 요청 도착`,
            html,
            dedupeKey: `rfq:${rfqRow.id}:invite:${draft.pgEmail}`,
          },
          tx,
        );
        sentCount += 1;
      }

      return { ok: true, sentCount };
    },
  );

  if (result.ok) {
    emitAfterCommit(pendingEmits);
    flushAfterCommit();
  }
  return result;
}

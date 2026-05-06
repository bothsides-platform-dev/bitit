'use server';

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';

import { requireBuyerSession } from '@/lib/auth/session';
import { bids, rfqs, workspaceMembers } from '@/lib/db/schema';
import { getRfqRepo } from '@/lib/server/repositories/factory';
import {
  dispatchNotification,
  emitAfterCommit,
} from '@/lib/server/notifications/dispatch';
import type { Notification } from '@/lib/types/notification';
import { actionDb, type RfqActionResult } from './_shared';

const Input = z.object({ rfqId: z.string().min(1) }).strict();

export type CancelRfqInput = z.infer<typeof Input>;
export type CancelRfqResult = RfqActionResult;

/**
 * RFQ 취소. buyer 워크스페이스 ownership 검증 + transition('cancelled').
 * 알림은 invited PG ws 멤버에게 인앱만 — loser 패턴(이메일 없음).
 */
export async function cancelRfqAction(
  input: CancelRfqInput,
): Promise<CancelRfqResult> {
  let session;
  try {
    session = await requireBuyerSession();
  } catch {
    return { ok: false, error: 'FORBIDDEN_BUYER' };
  }
  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const { rfqId } = parsed.data;
  const wsId = session.user.workspaceId;
  const db = actionDb();

  const pendingEmits: Notification[] = [];

  const result: CancelRfqResult = await db.transaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (tx: any): Promise<CancelRfqResult> => {
      const [row] = await tx
        .select({ buyerWsId: rfqs.buyerWsId })
        .from(rfqs)
        .where(eq(rfqs.id, rfqId))
        .limit(1);
      if (!row) return { ok: false, error: 'RFQ_NOT_FOUND' };
      if (row.buyerWsId !== wsId) {
        return { ok: false, error: 'FORBIDDEN_BUYER' };
      }

      const repo = await getRfqRepo();
      try {
        await repo.transition(rfqId, 'cancelled', undefined, tx);
      } catch (e) {
        return {
          ok: false,
          error: `INVALID_TRANSITION: ${(e as Error).message}`,
        };
      }

      // 입찰 제출했던 PG ws 멤버 each — in-app rfq.cancelled.
      const submittedBids = await tx
        .select({ pgWsId: bids.pgWsId })
        .from(bids)
        .where(and(eq(bids.rfqId, rfqId), eq(bids.status, 'submitted')));
      const wsSet = new Set<string>(
        (submittedBids as { pgWsId: string }[]).map((b) => b.pgWsId),
      );
      for (const pgWsId of wsSet) {
        const members = await tx
          .select({ userId: workspaceMembers.userId })
          .from(workspaceMembers)
          .where(eq(workspaceMembers.workspaceId, pgWsId));
        for (const m of members as { userId: string }[]) {
          const notif: Notification = {
            id: randomUUID(),
            userId: m.userId,
            workspaceId: pgWsId,
            type: 'rfq.cancelled',
            title: `[${rfqId}] 취소됨`,
            body: '구매사가 견적 요청을 취소했습니다.',
            channel: 'inapp',
            status: 'pending',
            linkUrl: `/inbox/${rfqId}`,
            createdAt: new Date().toISOString(),
          };
          await dispatchNotification(tx, notif);
          pendingEmits.push(notif);
        }
      }

      return { ok: true };
    },
  );

  if (result.ok) emitAfterCommit(pendingEmits);
  return result;
}

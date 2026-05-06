'use server';

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';

import { requireBuyerSession } from '@/lib/auth/session';
import { bids, rfqs, workspaceMembers } from '@/lib/db/schema';
import {
  getNotificationRepo,
  getRfqRepo,
} from '@/lib/server/repositories/factory';
import { actionDb, type RfqActionResult } from './_shared';

const Input = z.object({ rfqId: z.string().min(1) }).strict();

export type CloseRfqInput = z.infer<typeof Input>;
export type CloseRfqResult = RfqActionResult;

/**
 * RFQ 마감. buyer 워크스페이스 ownership 검증 + transition('closed').
 * 알림은 입찰 제출 PG ws 멤버 each — 인앱만(이메일 없음).
 */
export async function closeRfqAction(
  input: CloseRfqInput,
): Promise<CloseRfqResult> {
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

  return await db.transaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (tx: any): Promise<CloseRfqResult> => {
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
        await repo.transition(rfqId, 'closed', undefined, tx);
      } catch (e) {
        return {
          ok: false,
          error: `INVALID_TRANSITION: ${(e as Error).message}`,
        };
      }

      const submittedBids = await tx
        .select({ pgWsId: bids.pgWsId })
        .from(bids)
        .where(and(eq(bids.rfqId, rfqId), eq(bids.status, 'submitted')));
      const wsSet = new Set<string>(
        (submittedBids as { pgWsId: string }[]).map((b) => b.pgWsId),
      );
      const notifRepo = await getNotificationRepo();
      for (const pgWsId of wsSet) {
        const members = await tx
          .select({ userId: workspaceMembers.userId })
          .from(workspaceMembers)
          .where(eq(workspaceMembers.workspaceId, pgWsId));
        for (const m of members as { userId: string }[]) {
          await notifRepo.save(
            {
              id: randomUUID(),
              userId: m.userId,
              workspaceId: pgWsId,
              type: 'rfq.closed',
              title: `[${rfqId}] 마감됨`,
              body: '구매사가 견적 요청을 마감했습니다.',
              channel: 'inapp',
              status: 'pending',
              linkUrl: `/inbox/${rfqId}`,
              createdAt: new Date().toISOString(),
            },
            tx,
          );
        }
      }

      return { ok: true };
    },
  );
}

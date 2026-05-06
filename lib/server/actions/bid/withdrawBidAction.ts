'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { requirePgSession } from '@/lib/auth/session';
import { bids } from '@/lib/db/schema';
import {
  getBidRepo,
  getInvitationRepo,
} from '@/lib/server/repositories/factory';
import { actionDb, type BidActionResult } from './_shared';

const Input = z
  .object({
    bidId: z.string().uuid(),
  })
  .strict();

export type WithdrawBidInput = z.infer<typeof Input>;
export type WithdrawBidResult = BidActionResult;

/**
 * PG 견적 철회 — bid.status='withdrawn'.
 *
 * 가드:
 *   1) requirePgSession.
 *   2) bid 조회 → bid.pgWsId === session.workspaceId.
 *   3) canAccess(rfqId, userId) — 도메인 동료가 아닌 클레이머만 철회 가능.
 *
 * NOTE (advisor pin 4): withdrawn 이후 재제출은 v0에서 막는다 — submitBid가 다시
 * UNIQUE(rfqId, pgWsId) 충돌로 'BID_ALREADY_SUBMITTED' 반환.
 */
export async function withdrawBidAction(
  input: WithdrawBidInput,
): Promise<WithdrawBidResult> {
  let session;
  try {
    session = await requirePgSession();
  } catch {
    return { ok: false, error: 'FORBIDDEN_PG' };
  }

  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const bidRepo = await getBidRepo();
  const bid = await bidRepo.findById(parsed.data.bidId);
  if (!bid) return { ok: false, error: 'BID_NOT_FOUND' };

  // 같은 ws 가드 — bid.pgWsId === session.user.workspaceId.
  if (bid.pgWsId !== session.user.workspaceId) {
    return { ok: false, error: 'FORBIDDEN' };
  }

  // canAccess — 도메인 동료 차단(advisor pin 2): 클레임한 본인만 철회.
  const invRepo = await getInvitationRepo();
  const ok = await invRepo.canAccess(bid.rfqId, session.user.id);
  if (!ok) return { ok: false, error: 'FORBIDDEN' };

  if (bid.status === 'withdrawn') return { ok: true };

  const db = actionDb();
  await db
    .update(bids)
    .set({ status: 'withdrawn' })
    .where(eq(bids.id, bid.id));

  return { ok: true };
}

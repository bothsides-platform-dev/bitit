'use server';

import { requireSession } from '@/lib/auth/session';
import { getInvitationRepo } from '@/lib/server/repositories/factory';
import { hashToken } from '@/lib/server/token';

export type ClaimInviteTokenResult =
  | { ok: true; rfqId: string }
  | { ok: false; error: string };

/**
 * RFQ 초대 토큰 클레임 — 인증된 사용자가 raw 토큰을 제시.
 *
 * 흐름:
 *   1) requireSession().
 *   2) `findByTokenHash(hash(rawToken))` — invitation 조회. 없으면 INVITE_INVALID.
 *   3) 워크스페이스 멤버십 검사: inv.pgWsId !== session.user.workspaceId
 *      → INVITE_NOT_MEMBER.
 *   4) `claimToken(rawToken, userId)` atomic — 만료/사용/무효 분기.
 */
export async function claimInviteTokenAction(
  rawToken: string,
): Promise<ClaimInviteTokenResult> {
  let session;
  try {
    session = await requireSession();
  } catch {
    return { ok: false, error: 'UNAUTHENTICATED' };
  }

  if (!rawToken || typeof rawToken !== 'string') {
    return { ok: false, error: 'INVITE_INVALID' };
  }

  const invRepo = await getInvitationRepo();
  const tokenHash = hashToken(rawToken);

  // 1. invitation row 조회.
  const inv = await invRepo.findByTokenHash(tokenHash);
  if (!inv) return { ok: false, error: 'INVITE_INVALID' };

  // 2. 워크스페이스 멤버십 검사 — 초대된 PG ws 소속 사용자만 통과.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userWsId = (session.user as any).workspaceId as string | undefined;
  if (!inv.pgWsId || inv.pgWsId !== userWsId) {
    return { ok: false, error: 'INVITE_NOT_MEMBER' };
  }

  // 3. atomic claim.
  const claim = await invRepo.claimToken(rawToken, session.user.id);
  if (!claim.ok) {
    if (claim.reason === 'expired') return { ok: false, error: 'INVITE_EXPIRED' };
    if (claim.reason === 'used') return { ok: false, error: 'INVITE_USED' };
    return { ok: false, error: 'INVITE_INVALID' };
  }

  return { ok: true, rfqId: claim.invitation.rfqId };
}

'use server';

import { requireSession } from '@/lib/auth/session';
import { getInvitationRepo } from '@/lib/server/repositories/factory';
import { hashToken } from '@/lib/server/token';
import { autoJoinPgWorkspace } from './_pgAutoJoin';

export type ClaimInviteTokenResult =
  | { ok: true; rfqId: string }
  | { ok: false; error: string };

/**
 * RFQ 초대 토큰 클레임 — 인증된 사용자가 raw 토큰을 제시.
 *
 * 흐름:
 *   1) `findByTokenHash(hash(rawToken))` — invitation 조회. 없으면 INVITE_INVALID.
 *   2) **email 매칭 검사 (advisor pin 3)**: invitation.pgEmail !== session.user.email
 *      → INVITE_EMAIL_MISMATCH. 같은 도메인 동료가 토큰 가로채기 차단.
 *   3) `claimToken(rawToken, userId)` atomic — 만료/사용/무효 분기.
 *   4) `WorkspaceRepo.autoJoinPg()` — 도메인 매칭 PG ws에 합류.
 *      매칭 ws가 없으면 새 PG ws 생성(name=domain, domain=domain) + admin 멤버 insert.
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

  const userEmail = session.user.email;
  if (!userEmail) return { ok: false, error: 'UNAUTHENTICATED' };

  const invRepo = await getInvitationRepo();
  const tokenHash = hashToken(rawToken);

  // 1. invitation row 조회 (claim 전 email 매칭 검사용).
  const inv = await invRepo.findByTokenHash(tokenHash);
  if (!inv) return { ok: false, error: 'INVITE_INVALID' };

  // 2. email 매칭 검사 — case-insensitive(Auth.js authorize와 동일).
  if (inv.pgEmail.trim().toLowerCase() !== userEmail.trim().toLowerCase()) {
    return { ok: false, error: 'INVITE_EMAIL_MISMATCH' };
  }

  // 3. atomic claim.
  const claim = await invRepo.claimToken(rawToken, session.user.id);
  if (!claim.ok) {
    if (claim.reason === 'expired') return { ok: false, error: 'INVITE_EXPIRED' };
    if (claim.reason === 'used') return { ok: false, error: 'INVITE_USED' };
    return { ok: false, error: 'INVITE_INVALID' };
  }

  // 4. PG ws auto-join (or create if domain ws does not exist yet).
  await autoJoinPgWorkspace(session, userEmail);

  return { ok: true, rfqId: claim.invitation.rfqId };
}

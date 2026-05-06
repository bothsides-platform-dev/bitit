'use server';

import { randomUUID } from 'node:crypto';

import { workspaces, workspaceMembers } from '@/lib/db/schema';
import { requireSession } from '@/lib/auth/session';
import {
  getInvitationRepo,
  getWorkspaceRepo,
} from '@/lib/server/repositories/factory';
import { hashToken } from '@/lib/server/token';
import { actionDb } from '../bid/_shared';

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
  const wsRepo = await getWorkspaceRepo();
  const domain = userEmail.split('@')[1];
  if (domain) {
    // user payload 형태 — autoJoinPg는 이 user 객체를 멤버 insert에 사용.
    const userPayload = {
      id: session.user.id,
      name: session.user.name ?? '',
      email: userEmail,
      avatarColor: 'ink' as const,
      role: 'member' as const,
      status: 'active' as const,
      joinedAt: new Date().toISOString(),
    };

    const joined = await wsRepo.autoJoinPg(userEmail, userPayload);
    if (!joined) {
      // 도메인 매칭 PG ws가 없음 — 새 PG ws 생성 + admin 멤버 insert.
      // (autoJoinPg는 시그니처상 'create' 분기가 없어 액션 레벨에서 raw insert.)
      const db = actionDb();
      const wsId = randomUUID();
      await db.transaction(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (tx: any) => {
          // 이 시점엔 user는 이미 DB에 있다(requireSession이 통과했음).
          await tx.insert(workspaces).values({
            id: wsId,
            type: 'pg',
            name: domain,
            domain,
            bizProfileId: null,
          });
          await tx
            .insert(workspaceMembers)
            .values({
              workspaceId: wsId,
              userId: session.user.id,
              role: 'admin',
            })
            .onConflictDoNothing({
              target: [workspaceMembers.workspaceId, workspaceMembers.userId],
            });
        },
      );
    }
  }

  return { ok: true, rfqId: claim.invitation.rfqId };
}

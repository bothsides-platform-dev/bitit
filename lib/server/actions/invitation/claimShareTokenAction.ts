'use server';

import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';

import { rfqInvitations } from '@/lib/db/schema';
import { requireSession } from '@/lib/auth/session';
import { getRfqRepo } from '@/lib/server/repositories/factory';
import { generateToken, hashToken } from '@/lib/server/token';
import { actionDb } from '../bid/_shared';

export type ClaimShareTokenResult =
  | { ok: true; rfqId: string }
  | { ok: false; error: string };

/**
 * RFQ-scoped 공유 링크 토큰 클레임. 인증된 사용자가 raw `shareToken`을 제시하면
 * RFQ에 자동 합류 + 인박스에 노출.
 *
 * 흐름:
 *   1. session 필수(`UNAUTHENTICATED`).
 *   2. buyer 세션 차단(`SHARE_BUYER_NOT_ALLOWED`) — 공유 링크는 PG 측 진입 전용.
 *   3. `rfqRepo.findByShareToken(rawToken)` — 매칭 RFQ 조회. 없으면 `SHARE_INVALID`.
 *   4. 만료/종료 가드: `status !== 'sent'` 또는 `deadline <= now` → `SHARE_EXPIRED`.
 *   5. 워크스페이스 허용 목록 검사: `allowedPgWorkspaceIds`에 session.user.workspaceId
 *      포함 여부 확인. 불일치 → `WORKSPACE_NOT_ALLOWED`.
 *   6. 같은 ws가 같은 RFQ에 이미 invitation row를 가진 경우 idempotent —
 *      그렇지 않으면 audit row(`status='accepted'`, fresh tokenHash) 생성. 이
 *      row가 있어야 `findByPgWorkspace`로 인박스에 노출되고 `canAccess`도 통과.
 */
export async function claimShareTokenAction(
  rawToken: string,
): Promise<ClaimShareTokenResult> {
  let session;
  try {
    session = await requireSession();
  } catch {
    return { ok: false, error: 'UNAUTHENTICATED' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userSession = session.user as any;

  if (userSession.workspaceType === 'buyer') {
    return { ok: false, error: 'SHARE_BUYER_NOT_ALLOWED' };
  }

  if (!rawToken || typeof rawToken !== 'string') {
    return { ok: false, error: 'SHARE_INVALID' };
  }

  const userWsId = userSession.workspaceId as string | undefined;
  if (!userWsId) return { ok: false, error: 'UNAUTHENTICATED' };

  const rfqRepo = await getRfqRepo();
  const rfq = await rfqRepo.findByShareToken(rawToken);
  if (!rfq) return { ok: false, error: 'SHARE_INVALID' };

  if (rfq.status !== 'sent' || new Date(rfq.deadline).getTime() <= Date.now()) {
    return { ok: false, error: 'SHARE_EXPIRED' };
  }

  // 워크스페이스 허용 목록 검증
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allowedWsIds: string[] = (rfq as any).allowedPgWorkspaceIds ?? [];
  if (!allowedWsIds.includes(userWsId)) {
    return { ok: false, error: 'WORKSPACE_NOT_ALLOWED' };
  }

  // audit invitation row(idempotent). 같은 RFQ + 같은 PG ws의 row가 이미 있으면
  // 새로 만들지 않는다. unique: (rfq_id, pg_ws_id).
  const db = actionDb();
  await db.transaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (tx: any) => {
      const [existing] = await tx
        .select({ id: rfqInvitations.id })
        .from(rfqInvitations)
        .where(
          and(
            eq(rfqInvitations.rfqId, rfq.id),
            eq(rfqInvitations.pgWsId, userWsId),
          ),
        )
        .limit(1);
      if (existing) return;

      const auditToken = generateToken();
      try {
        await tx.insert(rfqInvitations).values({
          id: randomUUID(),
          rfqId: rfq.id,
          pgWsId: userWsId,
          acceptedByUserId: session.user.id,
          tokenHash: hashToken(auditToken),
          sentAt: new Date(),
          expiresAt: new Date(rfq.deadline),
          status: 'accepted',
        });
      } catch (err) {
        // (rfq_id, pg_ws_id) unique 위배 — 동시 진입 또는 레이스. 건너뛰고 통과.
        const code = (err as { code?: string }).code;
        if (code !== '23505') throw err;
      }
    },
  );

  return { ok: true, rfqId: rfq.id };
}

import { randomUUID } from 'node:crypto';

import { workspaces, workspaceMembers } from '@/lib/db/schema';
import { getWorkspaceRepo } from '@/lib/server/repositories/factory';
import { actionDb } from '../bid/_shared';

type Session = {
  user: { id: string; name?: string | null; email?: string | null };
};

/**
 * 인증된 사용자를 도메인 매칭 PG 워크스페이스에 합류시킨다. 매칭 ws가 없으면
 * `name=domain, domain=domain` 으로 신규 PG ws + admin 멤버를 생성한다.
 *
 * `claimInviteTokenAction`(이메일 단건 토큰)과 `claimShareTokenAction`(RFQ 도메인
 * 공유 링크) 양쪽이 동일 로직을 재사용. 분리된 사유는 두 진입점이 서로 다른
 * 토큰 모델/검증을 갖지만 PG 합류 자체는 동일하다는 점.
 */
export async function autoJoinPgWorkspace(
  session: Session,
  userEmail: string,
): Promise<void> {
  const domain = userEmail.split('@')[1];
  if (!domain) return;

  const userPayload = {
    id: session.user.id,
    name: session.user.name ?? '',
    email: userEmail,
    avatarColor: 'ink' as const,
    role: 'member' as const,
    status: 'active' as const,
    joinedAt: new Date().toISOString(),
  };

  const wsRepo = await getWorkspaceRepo();
  const joined = await wsRepo.autoJoinPg(userEmail, userPayload);
  if (joined) return;

  // 도메인 매칭 ws가 없음 — 신규 PG ws + admin 멤버 row 생성.
  const db = actionDb();
  const wsId = randomUUID();
  await db.transaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (tx: any) => {
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

// Step 8: PG 수신함 (RSC).
//
// - `auth()` 후 `getInvitationRepo().findByPgUser(userId)` — PG 사용자가 클레임한
//   invitation + RFQ pair 목록.
// - mock import 제거. 미클레임 invitation은 더 이상 표시 안 함(클레임 후 인박스
//   진입이 v0 정책).
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getInvitationRepo } from '@/lib/server/repositories/factory';
import { GRADE_LABELS } from '@/lib/types/biz-profile';
import { InboxList } from '@/components/inbox/InboxList';

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?next=/inbox');

  const invRepo = await getInvitationRepo();
  const pairs = await invRepo.findByPgUser(session.user.id);

  // RSC → client component로 직렬화 가능한 plain object만 전달.
  const rows = pairs.map(({ invitation, rfq }) => ({
    invitationId: invitation.id,
    invitationStatus: invitation.status,
    rfqId: rfq.id,
    rfqTitle: rfq.title,
    rfqDeadline: rfq.deadline,
    grade: rfq.bizProfile?.grade
      ? GRADE_LABELS[rfq.bizProfile.grade]
      : '—',
  }));

  return <InboxList rows={rows} />;
}

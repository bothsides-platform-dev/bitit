'use server';

// inbox/[rfqId] RSC 진입 시 호출 — 본인이 accepted 한 invitation 을 opened 로 전이.
// PG 홈 칸반의 '검토중' 컬럼을 활성화하기 위한 시그널. 이미 opened 이상이면 no-op.
import { auth } from '@/auth';
import { getInvitationRepo } from '../../repositories/factory';

export async function markInvitationOpenedAction(input: {
  rfqId: string;
}): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const invRepo = await getInvitationRepo();
  const all = await invRepo.findByRfq(input.rfqId);
  const mine = all.find((i) => i.acceptedByUserId === session.user!.id);
  if (!mine) return;
  if (mine.status !== 'accepted') return;

  await invRepo.markOpened(mine.id, new Date());
}

// Step 8: RFQ invite landing.
//
// - 비인증: RSC에서 초대 이메일을 서버사이드로 조회 후 InviteUnauthClient에 전달.
//   클라이언트가 signupEmailAction 호출 → /signup/pg/verify (Gs2)로 직행.
//   초대 row가 없으면 /signup/pg (Gs1)로 fallback.
// - 인증: claimInviteTokenAction 호출 → ok면 /inbox/<rfqId>로 redirect, error면 표시.
//
// RSC + 작은 client 컴포넌트 분리. 인증된 경우 클라이언트가 액션을 호출해야
// error 상태(만료/사용/email 불일치)를 렌더할 수 있다.
import { auth } from '@/auth';
import { getInvitationRepo } from '@/lib/server/repositories/factory';
import { hashToken } from '@/lib/server/token';
import { InviteUnauthClient } from './InviteUnauthClient';
import { InviteAuthedClient } from './InviteAuthedClient';

type Props = { params: Promise<{ token: string }> };

export default async function InviteRfqPage({ params }: Props) {
  const { token } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    // Resolve invite email server-side so client can prefill and skip Gs1
    const invRepo = await getInvitationRepo();
    const invitation = await invRepo.findByTokenHash(hashToken(token));
    return (
      <InviteUnauthClient
        token={token}
        inviteEmail={invitation?.pgEmail ?? undefined}
      />
    );
  }

  return <InviteAuthedClient token={token} />;
}

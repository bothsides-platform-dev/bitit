// Step 8: RFQ invite landing.
//
// - 비인증: sessionStorage signupDraft.inviteToken 저장 후 /login?next=/invite/rfq/<token>
//   으로 redirect. (Step 5 보존 — `<InviteUnauthClient />`)
// - 인증: claimInviteTokenAction 호출 → ok면 /inbox/<rfqId>로 redirect, error면 표시.
//
// RSC + 작은 client 컴포넌트 분리. 인증된 경우 클라이언트가 액션을 호출해야
// error 상태(만료/사용/email 불일치)를 렌더할 수 있다.
import { auth } from '@/auth';
import { InviteUnauthClient } from './InviteUnauthClient';
import { InviteAuthedClient } from './InviteAuthedClient';

type Props = { params: Promise<{ token: string }> };

export default async function InviteRfqPage({ params }: Props) {
  const { token } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return <InviteUnauthClient token={token} />;
  }

  return <InviteAuthedClient token={token} />;
}

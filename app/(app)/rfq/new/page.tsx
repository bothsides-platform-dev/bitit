import { redirect } from 'next/navigation';
import { Serial } from '@/components/primitives/Serial';
import { RfqCreateForm } from '@/components/rfq/RfqCreateForm';
import { auth } from '@/auth';
import { getWorkspaceRepo } from '@/lib/server/repositories/factory';

export const dynamic = 'force-dynamic';

export default async function RfqNewPage() {
  const session = await auth();
  if (
    !session?.user?.id ||
    session.user.workspaceType !== 'buyer' ||
    !session.user.workspaceId
  ) {
    redirect('/login?next=/rfq/new');
  }

  const ws = await (await getWorkspaceRepo()).findById(session.user.workspaceId);
  if (!ws) {
    redirect('/login?next=/rfq/new');
  }
  // 사업자번호 미등록 워크스페이스는 RFQ 생성 자체를 차단. createRfqAction 도
  // 같은 가드를 가지지만 (race 안전망), 사용자는 form 까지 도달하지 않게
  // 설정 페이지로 곧장 보낸다 — 거기 WorkspaceBizNoForm 으로 등록 후 복귀.
  if (!ws.bizProfile) {
    redirect('/settings/profile?biz_required=1');
  }

  return (
    <div className="px-8 py-8 max-w-[1100px] mx-auto">
      <div className="mb-10">
        <Serial current={1} total={4} label="RFQ" className="block mb-3" />
        <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          신규 견적 요청
        </h1>
      </div>
      <RfqCreateForm bizProfile={ws.bizProfile} workspaceName={ws.name} />
    </div>
  );
}

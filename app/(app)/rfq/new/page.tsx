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
  // ws.bizProfile 이 undefined 여도 RFQ 작성 진입 허용 (사전 견적 모드).
  // RFQ 작성 폼에서 인라인으로 사업자번호·등급 추가 가능.

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

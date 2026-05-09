import { auth } from '@/auth';
import { getWorkspaceRepo } from '@/lib/server/repositories/factory';
import { RfqCreateForm } from '@/components/rfq/RfqCreateForm';

export const dynamic = 'force-dynamic';

export default async function RfqNewPage() {
  const session = await auth();

  // Guest (unauthenticated) — form renders in guest mode
  if (!session?.user?.id || session.user.workspaceType !== 'buyer' || !session.user.workspaceId) {
    return (
      <div className="px-8 py-8 lg:h-full lg:flex lg:flex-col lg:overflow-hidden">
        <div className="mb-10 lg:flex-none">
          <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
            신규 견적 요청
          </h1>
        </div>
        <div className="lg:flex-1 lg:min-h-0">
          <RfqCreateForm guest />
        </div>
      </div>
    );
  }

  const ws = await (await getWorkspaceRepo()).findById(session.user.workspaceId);
  // ws.bizProfile 미등록이어도 RFQ 작성 허용 (사전 견적 모드)
  return (
    <div className="px-8 py-8 lg:h-full lg:flex lg:flex-col lg:overflow-hidden">
      <div className="mb-10 lg:flex-none">
        <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
          신규 견적 요청
        </h1>
      </div>
      <div className="lg:flex-1 lg:min-h-0">
        <RfqCreateForm
          bizProfile={ws?.bizProfile}
          workspaceName={ws?.name ?? ''}
        />
      </div>
    </div>
  );
}

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
  if (!ws || !ws.bizProfile) {
    return (
      <div className="px-8 py-12 max-w-[640px]">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]">
          워크스페이스 사업자 정보가 등록되지 않았습니다. 설정에서 먼저 등록해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-[820px]">
      <div className="mb-10">
        <Serial current={1} total={4} label="RFQ" className="block mb-3" />
        <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          신규 견적 요청
        </h1>
      </div>
      <RfqCreateForm
        bizProfile={{
          bizNo: ws.bizProfile.bizNo,
          taxType: ws.bizProfile.taxType,
          status: ws.bizProfile.status,
          grade: ws.bizProfile.grade,
        }}
        workspaceName={ws.name}
      />
    </div>
  );
}

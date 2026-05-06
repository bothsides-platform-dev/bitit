import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Button } from '@/components/primitives/Button';
import { EmptyState } from '@/components/primitives/EmptyState';
import { FileTextIcon } from '@/components/icons';
import { RfqListTable } from '@/components/rfq/RfqListTable';
import { auth } from '@/auth';
import { getRfqRepo } from '@/lib/server/repositories/factory';

export const dynamic = 'force-dynamic';

export default async function RfqListPage() {
  const session = await auth();
  if (
    !session?.user?.id ||
    session.user.workspaceType !== 'buyer' ||
    !session.user.workspaceId
  ) {
    redirect('/login?next=/rfq');
  }

  const rfqs = await (await getRfqRepo()).findByBuyerWs(session.user.workspaceId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--color-hair)]">
        <div>
          <Eyebrow>RFQ — 견적 요청</Eyebrow>
          <h1 className="text-[20px] font-[700] tracking-[-0.02em] text-[var(--color-ink)] mt-1">
            견적 요청 목록
          </h1>
        </div>
        <Link href="/rfq/new">
          <Button size="sm">+ 신규 견적</Button>
        </Link>
      </div>

      {rfqs.length === 0 ? (
        <EmptyState
          icon={<FileTextIcon size={32} />}
          title="발송된 견적 요청이 없습니다."
          description="새로운 견적 요청을 작성해 PG사에 발송하세요."
          action={
            <Link href="/rfq/new">
              <Button size="sm">+ 신규 견적</Button>
            </Link>
          }
        />
      ) : (
        <RfqListTable rfqs={rfqs} />
      )}
    </div>
  );
}

import Link from 'next/link';
import { EmptyState } from '@/components/primitives/EmptyState';
import { Button } from '@/components/primitives/Button';
import { PageEnter } from '@/components/primitives/PageEnter';
import { FileTextIcon } from '@/components/icons';
import { getBuyerKanbanData } from '@/lib/server/buyer-kanban-loader';
import { KanbanBoard } from './KanbanBoard';

export async function BuyerHome({ workspaceId }: { workspaceId: string }) {
  const cards = await getBuyerKanbanData(workspaceId);

  if (cards.length === 0) {
    return (
      <PageEnter className="px-8 py-10">
        <EmptyState
          icon={<FileTextIcon size={32} />}
          title="첫 RFQ를 작성하세요."
          description="PG사에 견적 요청을 보내고 한눈에 비교하세요."
          action={
            <Link href="/rfq/new">
              <Button size="sm">+ 새 RFQ</Button>
            </Link>
          }
        />
      </PageEnter>
    );
  }

  return (
    <PageEnter className="px-8 py-10">
      <KanbanBoard role="buyer" cards={cards} />
    </PageEnter>
  );
}

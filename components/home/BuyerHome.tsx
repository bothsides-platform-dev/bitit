import { PageEnter } from '@/components/primitives/PageEnter';
import { getBuyerKanbanData } from '@/lib/server/buyer-kanban-loader';
import { KanbanBoard } from './KanbanBoard';

export async function BuyerHome({ workspaceId }: { workspaceId: string }) {
  const cards = await getBuyerKanbanData(workspaceId);

  return (
    <PageEnter className="px-8 py-10">
      <KanbanBoard role="buyer" cards={cards} />
    </PageEnter>
  );
}

import { EmptyState } from '@/components/primitives/EmptyState';
import { InboxIcon } from '@/components/icons';

export default function InboxPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-5 border-b border-[var(--color-hair)]">
        <h1 className="text-[20px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">수신함</h1>
      </div>
      <EmptyState
        icon={<InboxIcon size={32} />}
        title="받은 견적 요청이 없습니다."
        description="구매사가 초대한 RFQ가 이 화면에 표시됩니다."
      />
    </div>
  );
}

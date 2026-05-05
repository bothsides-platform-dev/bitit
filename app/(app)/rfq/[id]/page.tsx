import { Eyebrow } from '@/components/primitives/Eyebrow';
import { MOCK_RFQS } from '@/lib/mock/rfqs';
import { MOCK_BIDS } from '@/lib/mock/bids';
import { Tag } from '@/components/primitives/Tag';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function RfqDetailPage({ params }: Props) {
  const { id } = await params;
  const rfq = MOCK_RFQS.find((r) => r.id === id);
  if (!rfq) return notFound();
  const bids = MOCK_BIDS.filter((b) => b.rfqId === id);

  return (
    <div className="px-8 py-8 max-w-[var(--content-max)]">
      <div className="mb-6">
        <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-soft)]">{rfq.id}</span>
        <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)] mt-1">
          {rfq.title}
        </h1>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <Eyebrow>견적 수 {bids.length}</Eyebrow>
        <Tag variant="amber">{rfq.status}</Tag>
      </div>

      <p className="text-[12px] text-[var(--color-ink-soft)] font-mono uppercase tracking-[0.1em]">
        M4 마일스톤에서 비교표·PDF 미리보기 구현 예정
      </p>
    </div>
  );
}

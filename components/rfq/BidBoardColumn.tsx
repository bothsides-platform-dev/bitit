'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import Link from 'next/link';
import { Tag } from '@/components/primitives/Tag';
import { BidBoardCard } from './BidBoardCard';
import { cn } from '@/lib/utils';
import type { Bid, BuyerStage } from '@/lib/types/bid';
import { BUYER_STAGE_LABEL } from '@/lib/types/bid';

const stageTagVariant: Record<BuyerStage, 'muted' | 'amber' | 'moss'> = {
  pending: 'muted',
  negotiating: 'amber',
  decided: 'moss',
};

type Props = {
  stage: BuyerStage;
  bids: Bid[];
  pgName: (wsId: string) => string;
  onCardClick: (bidId: string) => void;
  onMoveStage: (bidId: string, to: BuyerStage) => void;
  noteCounts: Record<string, number>;
  awardedBidId?: string;
  canAward: boolean;
  rfqId: string;
  disabled: boolean;
};

export function BidBoardColumn({
  stage,
  bids,
  pgName,
  onCardClick,
  onMoveStage,
  noteCounts,
  awardedBidId,
  canAward,
  rfqId,
  disabled,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage, disabled });

  const showAwardCta = stage === 'decided' && canAward && bids.length === 1;
  const awardDisabled = stage === 'decided' && canAward && bids.length > 1;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-h-[200px] rounded-md transition-colors',
        isOver
          ? 'bg-[var(--color-paper-warm)] outline outline-1 outline-dashed outline-[var(--color-hair-strong)]'
          : 'bg-transparent',
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between gap-2 px-1 pb-3 mb-3 border-b border-[var(--color-hair)]">
        <div className="flex items-center gap-2">
          <Tag variant={stageTagVariant[stage]}>
            {BUYER_STAGE_LABEL[stage]}
          </Tag>
          <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-soft)]">
            {String(bids.length).padStart(2, '0')}
          </span>
        </div>
        {showAwardCta && (
          <Link
            href={`/rfq/${rfqId}/award?bidId=${bids[0].id}`}
            className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink)] hover:underline"
          >
            수주 처리 →
          </Link>
        )}
        {awardDisabled && (
          <span
            className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)] cursor-help"
            title="결정 카드 중 1개를 선택해 카드 메뉴에서 수주 처리하세요"
          >
            수주 처리 →
          </span>
        )}
      </div>

      {/* Cards */}
      <SortableContext
        items={bids.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3 px-1 pb-2 min-h-[80px]">
          {bids.map((bid, i) => (
            <BidBoardCard
              key={bid.id}
              bid={bid}
              pgName={pgName(bid.pgWsId)}
              stage={stage}
              serial={i + 1}
              noteCount={noteCounts[bid.id] ?? 0}
              isAwarded={awardedBidId === bid.id}
              canAward={canAward}
              rfqId={rfqId}
              onClick={() => onCardClick(bid.id)}
              onMoveStage={(to) => onMoveStage(bid.id, to)}
              disabled={disabled || awardedBidId === bid.id}
            />
          ))}
          {bids.length === 0 && (
            <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)] py-6 text-center">
              —
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

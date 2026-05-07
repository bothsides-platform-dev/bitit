'use client';

import { useState } from 'react';
import { BidComparisonTable } from './BidComparisonTable';
import { BidBoard } from './BidBoard';
import { BidViewToggle, type BidView } from './BidViewToggle';
import type { Bid } from '@/lib/types/bid';
import type { MerchantGrade } from '@/lib/types/biz-profile';

type Props = {
  rfqId: string;
  bids: Bid[];
  grade: MerchantGrade | undefined;
  rfqStatus: string;
  awardedBidId?: string;
  pgWsNameMap: Record<string, string>;
  authorId: string;
  authorName: string;
};

export function BidComparisonView(props: Props) {
  const [view, setView] = useState<BidView>('table');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <BidViewToggle value={view} onChange={setView} tableCount={props.bids.length} />
      </div>
      {view === 'table' ? (
        <BidComparisonTable
          rfqId={props.rfqId}
          bids={props.bids}
          grade={props.grade}
          rfqStatus={props.rfqStatus}
          awardedBidId={props.awardedBidId}
          pgWsNameMap={props.pgWsNameMap}
        />
      ) : (
        <BidBoard
          rfqId={props.rfqId}
          bids={props.bids}
          grade={props.grade}
          rfqStatus={props.rfqStatus}
          awardedBidId={props.awardedBidId}
          pgWsNameMap={props.pgWsNameMap}
          authorId={props.authorId}
          authorName={props.authorName}
        />
      )}
    </div>
  );
}

'use client';

import { create } from 'zustand';
import type { Bid } from '@/lib/types/bid';
import { MOCK_BIDS } from '@/lib/mock/bids';

type BidListStore = {
  bids: Bid[];
  addBid: (bid: Bid) => void;
  findByRfq: (rfqId: string) => Bid[];
};

export const useBidListStore = create<BidListStore>((set, get) => ({
  bids: [...MOCK_BIDS],
  addBid: (bid) => set((s) => ({ bids: [...s.bids, bid] })),
  findByRfq: (rfqId) => get().bids.filter((b) => b.rfqId === rfqId),
}));

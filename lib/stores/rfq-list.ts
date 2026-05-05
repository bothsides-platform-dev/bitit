'use client';

import { create } from 'zustand';
import type { RFQ } from '@/lib/types/rfq';
import { MOCK_RFQS } from '@/lib/mock/rfqs';

type RfqListStore = {
  rfqs: RFQ[];
  addRfq: (rfq: RFQ) => void;
  awardRfq: (id: string, bidId: string) => void;
};

export const useRfqListStore = create<RfqListStore>((set) => ({
  rfqs: [...MOCK_RFQS],
  addRfq: (rfq) => set((s) => ({ rfqs: [rfq, ...s.rfqs] })),
  awardRfq: (id, bidId) =>
    set((s) => ({
      rfqs: s.rfqs.map((r) =>
        r.id === id ? { ...r, status: 'awarded', awardedBidId: bidId } : r,
      ),
    })),
}));

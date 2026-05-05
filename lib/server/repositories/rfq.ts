import type { RFQ, RfqStatus } from '@/lib/types/rfq';
import { assertTransition } from '../rfq-state';

export class InMemoryRfqRepository {
  private store = new Map<string, RFQ>();

  save(rfq: RFQ): void {
    this.store.set(rfq.id, { ...rfq });
  }

  findById(id: string): RFQ | undefined {
    const rfq = this.store.get(id);
    return rfq ? { ...rfq } : undefined;
  }

  findByBuyerWs(wsId: string): RFQ[] {
    return [...this.store.values()].filter(r => r.buyerWsId === wsId).map(r => ({ ...r }));
  }

  transition(id: string, to: RfqStatus, patch?: Partial<RFQ>): RFQ {
    const rfq = this.store.get(id);
    if (!rfq) throw new Error(`RFQ not found: ${id}`);
    assertTransition(rfq.status, to);
    const updated: RFQ = { ...rfq, ...patch, status: to };
    this.store.set(id, updated);
    return { ...updated };
  }

  clear(): void {
    this.store.clear();
  }
}

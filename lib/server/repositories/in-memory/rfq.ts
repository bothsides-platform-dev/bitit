import type { RFQ, RfqStatus } from '@/lib/types/rfq';
import { assertTransition } from '../../rfq-state';
import type { RfqRepo, Tx } from '../types';

export class InMemoryRfqRepository implements RfqRepo {
  private store = new Map<string, RFQ>();

  async save(rfq: RFQ, _tx?: Tx): Promise<void> {
    void _tx;
    this.store.set(rfq.id, { ...rfq });
  }

  async findById(id: string, _tx?: Tx): Promise<RFQ | undefined> {
    void _tx;
    const rfq = this.store.get(id);
    return rfq ? { ...rfq } : undefined;
  }

  async findByBuyerWs(wsId: string, _tx?: Tx): Promise<RFQ[]> {
    void _tx;
    return [...this.store.values()]
      .filter((r) => r.buyerWsId === wsId)
      .map((r) => ({ ...r }));
  }

  async transition(
    id: string,
    to: RfqStatus,
    patch?: Partial<RFQ>,
    _tx?: Tx,
  ): Promise<RFQ> {
    void _tx;
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

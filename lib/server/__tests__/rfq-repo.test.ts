import { describe, expect, it, beforeEach } from 'vitest';
import { InMemoryRfqRepository } from '../repositories/rfq';
import type { RFQ } from '@/lib/types/rfq';

function makeRfq(id: string, status: RFQ['status'] = 'draft'): RFQ {
  return {
    id,
    buyerWsId: 'ws-buyer',
    bizProfile: {
      bizNo: '1234567890',
      taxType: 'general',
      status: 'active',
      gradeSource: 'user_confirmed',
    },
    title: 'Test RFQ',
    memo: '',
    rfpFiles: [],
    allowedPgEmails: [],
    deadline: new Date(Date.now() + 86_400_000).toISOString(),
    status,
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
  };
}

describe('InMemoryRfqRepository', () => {
  let repo: InMemoryRfqRepository;

  beforeEach(() => {
    repo = new InMemoryRfqRepository();
  });

  it('saves and retrieves by id', () => {
    repo.save(makeRfq('rfq-1'));
    expect(repo.findById('rfq-1')).toMatchObject({ id: 'rfq-1', status: 'draft' });
  });

  it('returns undefined for unknown id', () => {
    expect(repo.findById('nope')).toBeUndefined();
  });

  it('findByBuyerWs returns only matching workspace RFQs', () => {
    repo.save(makeRfq('rfq-1'));
    repo.save({ ...makeRfq('rfq-2'), buyerWsId: 'ws-other' });
    expect(repo.findByBuyerWs('ws-buyer')).toHaveLength(1);
  });

  it('transitions draft → sent', () => {
    repo.save(makeRfq('rfq-1'));
    const updated = repo.transition('rfq-1', 'sent');
    expect(updated.status).toBe('sent');
  });

  it('transitions sent → awarded with patch', () => {
    repo.save(makeRfq('rfq-1', 'sent'));
    const updated = repo.transition('rfq-1', 'awarded', { awardedBidId: 'bid-1' });
    expect(updated.status).toBe('awarded');
    expect(updated.awardedBidId).toBe('bid-1');
  });

  it('throws on invalid transition (draft → awarded)', () => {
    repo.save(makeRfq('rfq-1'));
    expect(() => repo.transition('rfq-1', 'awarded')).toThrow('Invalid RFQ transition');
  });

  it('throws when RFQ not found', () => {
    expect(() => repo.transition('nope', 'sent')).toThrow('RFQ not found');
  });

  it('returns immutable copy (store is not mutated from outside)', () => {
    repo.save(makeRfq('rfq-1'));
    const copy = repo.findById('rfq-1')!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (copy as any).status = 'sent';
    expect(repo.findById('rfq-1')!.status).toBe('draft');
  });
});

import { describe, it, expect } from 'vitest';
import { computePgHomeData } from '../pg-home';
import type { RfqInvitation } from '@/lib/types/invitation';
import type { RFQ } from '@/lib/types/rfq';
import type { Bid } from '@/lib/types/bid';

function makeRfq(id: string, overrides: Partial<RFQ> = {}): RFQ {
  return {
    id,
    buyerWsId: 'ws-buyer',
    title: `RFQ ${id}`,
    memo: '',
    rfpFiles: [],
    allowedPgEmails: [],
    deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    status: 'sent',
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeInv(id: string, rfqId: string, status: RfqInvitation['status']): RfqInvitation {
  return {
    id,
    rfqId,
    pgEmail: 'pg@test.com',
    uniqueToken: '',
    sentAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    status,
  };
}

function makeBid(id: string, rfqId: string, submittedAt: string): Bid {
  return {
    id,
    rfqId,
    pgWsId: 'ws-pg',
    invitationId: `inv-${id}`,
    settleCycle: 'D+1',
    deposit: 0,
    setupFee: 0,
    monthlyMin: 0,
    bankTransferFeePct: 0.003,
    easyPayFeePct: 0.015,
    proposalPdf: { id: '', name: '', size: 0, mimeType: '', url: '' },
    status: 'submitted',
    submittedBy: 'user-1',
    submittedAt,
  };
}

describe('computePgHomeData', () => {
  it('KPI: total = 전체 pair 수', () => {
    const pairs = [
      { invitation: makeInv('i1', 'r1', 'sent'), rfq: makeRfq('r1') },
      { invitation: makeInv('i2', 'r2', 'accepted'), rfq: makeRfq('r2') },
    ];
    const { kpi } = computePgHomeData(pairs, []);
    expect(kpi.total).toBe(2);
  });

  it('KPI: pending = sent + opened 상태', () => {
    const pairs = [
      { invitation: makeInv('i1', 'r1', 'sent'), rfq: makeRfq('r1') },
      { invitation: makeInv('i2', 'r2', 'opened'), rfq: makeRfq('r2') },
      { invitation: makeInv('i3', 'r3', 'accepted'), rfq: makeRfq('r3') },
    ];
    const { kpi } = computePgHomeData(pairs, []);
    expect(kpi.pending).toBe(2);
  });

  it('KPI: submitted = accepted 상태', () => {
    const pairs = [
      { invitation: makeInv('i1', 'r1', 'accepted'), rfq: makeRfq('r1') },
      { invitation: makeInv('i2', 'r2', 'sent'), rfq: makeRfq('r2') },
    ];
    const { kpi } = computePgHomeData(pairs, []);
    expect(kpi.submitted).toBe(1);
  });

  it('KPI: won = rfq.awardedBidId가 자사 bid인 건 수', () => {
    const pairs = [
      { invitation: makeInv('i1', 'r1', 'accepted'), rfq: makeRfq('r1', { awardedBidId: 'b1', status: 'awarded' }) },
      { invitation: makeInv('i2', 'r2', 'accepted'), rfq: makeRfq('r2', { awardedBidId: 'b-other', status: 'awarded' }) },
    ];
    const bids = [
      makeBid('b1', 'r1', '2025-04-01T00:00:00Z'),
      makeBid('b2', 'r2', '2025-04-02T00:00:00Z'),
    ];
    const { kpi } = computePgHomeData(pairs, bids);
    expect(kpi.won).toBe(1);
  });

  it('pendingPairs: deadline 오름차순 정렬', () => {
    const near = new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString();
    const far  = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const pairs = [
      { invitation: makeInv('i1', 'r1', 'sent'), rfq: makeRfq('r1', { deadline: far }) },
      { invitation: makeInv('i2', 'r2', 'sent'), rfq: makeRfq('r2', { deadline: near }) },
    ];
    const { pendingPairs } = computePgHomeData(pairs, []);
    expect(pendingPairs[0].rfq.id).toBe('r2');
    expect(pendingPairs[1].rfq.id).toBe('r1');
  });

  it('pendingPairs: accepted/expired 제외', () => {
    const pairs = [
      { invitation: makeInv('i1', 'r1', 'accepted'), rfq: makeRfq('r1') },
      { invitation: makeInv('i2', 'r2', 'sent'), rfq: makeRfq('r2') },
      { invitation: makeInv('i3', 'r3', 'expired'), rfq: makeRfq('r3') },
    ];
    const { pendingPairs } = computePgHomeData(pairs, []);
    expect(pendingPairs).toHaveLength(1);
    expect(pendingPairs[0].rfq.id).toBe('r2');
  });

  it('recentBids: submittedAt 내림차순 top 3', () => {
    const bids = [
      makeBid('b1', 'r1', '2025-04-01T00:00:00Z'),
      makeBid('b2', 'r2', '2025-04-03T00:00:00Z'),
      makeBid('b3', 'r3', '2025-04-02T00:00:00Z'),
      makeBid('b4', 'r4', '2025-04-04T00:00:00Z'),
    ];
    const { recentBids } = computePgHomeData([], bids);
    expect(recentBids).toHaveLength(3);
    expect(recentBids[0].bid.id).toBe('b4');
    expect(recentBids[1].bid.id).toBe('b2');
    expect(recentBids[2].bid.id).toBe('b3');
  });

  it('recentBids stage: won/lost/pending 정확히 판별', () => {
    const pairs = [
      { invitation: makeInv('i1', 'r1', 'accepted'), rfq: makeRfq('r1', { awardedBidId: 'b1', status: 'awarded' }) },
      { invitation: makeInv('i2', 'r2', 'accepted'), rfq: makeRfq('r2', { awardedBidId: 'b-other', status: 'awarded' }) },
      { invitation: makeInv('i3', 'r3', 'accepted'), rfq: makeRfq('r3', { status: 'sent' }) },
    ];
    const bids = [
      makeBid('b1', 'r1', '2025-04-03T00:00:00Z'),
      makeBid('b2', 'r2', '2025-04-02T00:00:00Z'),
      makeBid('b3', 'r3', '2025-04-01T00:00:00Z'),
    ];
    const { recentBids } = computePgHomeData(pairs, bids);
    expect(recentBids[0].stage).toBe('won');
    expect(recentBids[1].stage).toBe('lost');
    expect(recentBids[2].stage).toBe('pending');
  });
});

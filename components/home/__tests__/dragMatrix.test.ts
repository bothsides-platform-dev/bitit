import { describe, it, expect } from 'vitest';
import { resolveDrag } from '../dragMatrix';

describe('resolveDrag — buyer', () => {
  it('draft → sent: send-rfq', () => {
    const a = resolveDrag({
      role: 'buyer',
      from: 'draft',
      to: 'sent',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toEqual({
      kind: 'send-rfq',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
  });

  it('collecting → awarded: navigate-award', () => {
    const a = resolveDrag({
      role: 'buyer',
      from: 'collecting',
      to: 'awarded',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toEqual({ kind: 'navigate-rfq-detail', rfqId: 'Q-2605-0001' });
  });

  it('comparing → awarded: navigate-award', () => {
    const a = resolveDrag({
      role: 'buyer',
      from: 'comparing',
      to: 'awarded',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toEqual({ kind: 'navigate-rfq-detail', rfqId: 'Q-2605-0001' });
  });

  it('sent → closed: cancel-rfq', () => {
    const a = resolveDrag({
      role: 'buyer',
      from: 'sent',
      to: 'closed',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toEqual({
      kind: 'cancel-rfq',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
  });

  it('draft → closed: cancel-rfq', () => {
    const a = resolveDrag({
      role: 'buyer',
      from: 'draft',
      to: 'closed',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toEqual({
      kind: 'cancel-rfq',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
  });

  it('invalid: sent → awarded (이미 응답 있어야 함)', () => {
    const a = resolveDrag({
      role: 'buyer',
      from: 'sent',
      to: 'awarded',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toBeNull();
  });

  it('invalid: draft → awarded', () => {
    const a = resolveDrag({
      role: 'buyer',
      from: 'draft',
      to: 'awarded',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toBeNull();
  });

  it('invalid: collecting → sent (역방향)', () => {
    const a = resolveDrag({
      role: 'buyer',
      from: 'collecting',
      to: 'sent',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toBeNull();
  });

  it('invalid: same column', () => {
    const a = resolveDrag({
      role: 'buyer',
      from: 'collecting',
      to: 'collecting',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toBeNull();
  });
});

describe('resolveDrag — pg', () => {
  it('received → drafting: navigate-inbox', () => {
    const a = resolveDrag({
      role: 'pg',
      from: 'received',
      to: 'drafting',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toEqual({ kind: 'navigate-inbox', rfqId: 'Q-2605-0001' });
  });

  it('reviewing → drafting: navigate-inbox', () => {
    const a = resolveDrag({
      role: 'pg',
      from: 'reviewing',
      to: 'drafting',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toEqual({ kind: 'navigate-inbox', rfqId: 'Q-2605-0001' });
  });

  it('drafting → submitted: navigate-inbox (form 작성 필요)', () => {
    const a = resolveDrag({
      role: 'pg',
      from: 'drafting',
      to: 'submitted',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toEqual({ kind: 'navigate-inbox', rfqId: 'Q-2605-0001' });
  });

  it('submitted → lost: withdraw-bid', () => {
    const a = resolveDrag({
      role: 'pg',
      from: 'submitted',
      to: 'lost',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
      bidId: 'bid-uuid-1',
    });
    expect(a).toEqual({
      kind: 'withdraw-bid',
      bidId: 'bid-uuid-1',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
  });

  it('submitted → lost without bidId: invalid', () => {
    const a = resolveDrag({
      role: 'pg',
      from: 'submitted',
      to: 'lost',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toBeNull();
  });

  it('invalid: received → submitted', () => {
    const a = resolveDrag({
      role: 'pg',
      from: 'received',
      to: 'submitted',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toBeNull();
  });

  it('invalid: drafting → won (직접 낙찰 불가)', () => {
    const a = resolveDrag({
      role: 'pg',
      from: 'drafting',
      to: 'won',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toBeNull();
  });

  it('invalid: same column', () => {
    const a = resolveDrag({
      role: 'pg',
      from: 'drafting',
      to: 'drafting',
      rfqId: 'Q-2605-0001',
      title: 'RFQ 1',
    });
    expect(a).toBeNull();
  });
});

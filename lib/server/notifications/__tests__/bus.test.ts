// Per-user EventEmitter Map — Step 9 hard 제약 9: listener 누수 + dispatch 호출
// 카운트 어서션. 같은 userId에 다중 subscribe → emit fan-out, unsubscribe 시
// listenerCount === 0 + Map entry 회수.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  __resetBusForTest,
  emit,
  listenerCount,
  subscribe,
} from '../bus';
import type { Notification } from '@/lib/types/notification';

function n(userId: string, idSuffix = '1'): Notification {
  return {
    id: `n-${userId}-${idSuffix}`,
    userId,
    workspaceId: 'ws-x',
    type: 'bid.submitted',
    title: 't',
    body: 'b',
    channel: 'inapp',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

describe('notification bus (per-user EventEmitter Map)', () => {
  beforeEach(() => __resetBusForTest());
  afterEach(() => __resetBusForTest());

  it('subscribe → emit → handler called with the notification', () => {
    const calls: Notification[] = [];
    subscribe('u1', (notif) => calls.push(notif));
    emit('u1', n('u1'));
    expect(calls).toHaveLength(1);
    expect(calls[0].userId).toBe('u1');
  });

  it('unsubscribe → emit → handler NOT called', () => {
    const calls: Notification[] = [];
    const off = subscribe('u1', (notif) => calls.push(notif));
    off();
    emit('u1', n('u1'));
    expect(calls).toHaveLength(0);
  });

  it('per-user isolation: emit to userA does NOT call userB handler', () => {
    const callsA: Notification[] = [];
    const callsB: Notification[] = [];
    subscribe('userA', (x) => callsA.push(x));
    subscribe('userB', (x) => callsB.push(x));
    emit('userA', n('userA'));
    expect(callsA).toHaveLength(1);
    expect(callsB).toHaveLength(0);
  });

  it('listener cleanup: subscribe → unsubscribe → listenerCount === 0 (advisor pin 9)', () => {
    const off = subscribe('u1', () => {});
    expect(listenerCount('u1')).toBe(1);
    off();
    expect(listenerCount('u1')).toBe(0);
  });

  it('multiple subscribers same user — fan-out + each unsubscribe drops own listener', () => {
    const a: Notification[] = [];
    const b: Notification[] = [];
    const offA = subscribe('u1', (x) => a.push(x));
    const offB = subscribe('u1', (x) => b.push(x));
    expect(listenerCount('u1')).toBe(2);
    emit('u1', n('u1'));
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    offA();
    expect(listenerCount('u1')).toBe(1);
    emit('u1', n('u1', '2'));
    expect(a).toHaveLength(1); // off — not called
    expect(b).toHaveLength(2);
    offB();
    expect(listenerCount('u1')).toBe(0);
  });

  it('emit to user with no subscribers is a no-op (Map 미생성)', () => {
    expect(() => emit('ghost', n('ghost'))).not.toThrow();
    expect(listenerCount('ghost')).toBe(0);
  });
});

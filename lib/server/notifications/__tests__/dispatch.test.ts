// dispatchNotification + emitAfterCommit 단위 테스트.
//
// 검증:
//   - dispatchNotification은 tx 안에서 row insert만 수행 — emit 안 함.
//   - emitAfterCommit 호출 시 bus.subscribe handler가 받는다.
//   - tx rollback (caller가 throw) 시 emitAfterCommit가 호출되지 않으면
//     handler가 받지 않는다 (advisor pattern: emit는 commit 후에만).
//   - email channel은 emitAfterCommit이 skip — inapp만 SSE 채널.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { notifications as notifTable } from '@/lib/db/schema';
import { createPgliteDb, type PgliteDB } from '@/lib/db/client-pglite';
import {
  __resetForTest,
  __useDrizzleWithDbForTest,
} from '@/lib/server/repositories/factory';
import {
  seedBuyerWorkspace,
  seedUser,
  seedMembership,
} from '@/lib/server/repositories/drizzle/__tests__/_seed';
import type { Notification } from '@/lib/types/notification';

import {
  __resetBusForTest,
  listenerCount,
  subscribe,
} from '../bus';
import { dispatchNotification, emitAfterCommit } from '../dispatch';

let db: PgliteDB;
let userId: string;
let wsId: string;

async function setup(): Promise<void> {
  db = await createPgliteDb();
  __resetForTest();
  await __useDrizzleWithDbForTest(db);
  __resetBusForTest();
  const u = await seedUser(db, { email: 't@x.com' });
  const ws = await seedBuyerWorkspace(db);
  await seedMembership(db, ws.id, u.id, 'admin');
  userId = u.id;
  wsId = ws.id;
}

function n(overrides: Partial<Notification> = {}): Notification {
  return {
    id: randomUUID(),
    userId,
    workspaceId: wsId,
    type: 'bid.submitted',
    title: 't',
    body: 'b',
    channel: 'inapp',
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('dispatchNotification + emitAfterCommit', () => {
  beforeEach(async () => {
    await setup();
  });
  afterEach(() => {
    __resetForTest();
    __resetBusForTest();
  });

  it('writes row via tx and does NOT emit during dispatch', async () => {
    const received: Notification[] = [];
    subscribe(userId, (x) => received.push(x));
    const notif = n();

    await db.transaction(async (tx) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await dispatchNotification(tx as any, notif);
      // 아직 commit 전, emitAfterCommit 호출 전 — handler 미수신
      expect(received).toHaveLength(0);
    });
    // tx commit 직후에도 emit 안 했으니 여전히 0
    expect(received).toHaveLength(0);

    // 실제 row는 들어가 있다
    const rows = await db
      .select()
      .from(notifTable)
      .where(eq(notifTable.id, notif.id));
    expect(rows).toHaveLength(1);
  });

  it('emitAfterCommit pushes to subscriber (count +1)', async () => {
    const received: Notification[] = [];
    subscribe(userId, (x) => received.push(x));
    const notif = n();

    await db.transaction(async (tx) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await dispatchNotification(tx as any, notif);
    });
    emitAfterCommit([notif]);
    expect(received).toHaveLength(1);
    expect(received[0].id).toBe(notif.id);
  });

  it('rollback path — caller throws inside tx → no row, emit skipped', async () => {
    const received: Notification[] = [];
    subscribe(userId, (x) => received.push(x));
    const notif = n();

    await expect(
      db.transaction(async (tx) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await dispatchNotification(tx as any, notif);
        throw new Error('rollback please');
      }),
    ).rejects.toThrow('rollback please');

    // caller never called emitAfterCommit because tx threw
    expect(received).toHaveLength(0);
    const rows = await db
      .select()
      .from(notifTable)
      .where(eq(notifTable.id, notif.id));
    expect(rows).toHaveLength(0);
  });

  it('email channel is skipped by emitAfterCommit (inapp만 SSE)', async () => {
    const received: Notification[] = [];
    subscribe(userId, (x) => received.push(x));
    const inApp = n();
    const emailOnly = n({ channel: 'email', id: randomUUID() });
    emitAfterCommit([inApp, emailOnly]);
    expect(received).toHaveLength(1);
    expect(received[0].id).toBe(inApp.id);
  });

  it('listener count drops to 0 after the only subscriber unsubscribes', () => {
    const off = subscribe(userId, () => {});
    expect(listenerCount(userId)).toBe(1);
    off();
    expect(listenerCount(userId)).toBe(0);
  });
});

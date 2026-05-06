// markNotificationReadAction + markAllReadAction tests.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eq, and, isNotNull } from 'drizzle-orm';

import { notifications as notifTable } from '@/lib/db/schema';
import {
  seedBuyerWorkspace,
  seedMembership,
  seedUser,
} from '@/lib/server/repositories/drizzle/__tests__/_seed';
import type { PgliteDB } from '@/lib/db/client-pglite';
import {
  setupNotifActionEnv,
  teardownNotifActionEnv,
} from './_setup';

const sessionRef: {
  value: { user: { id: string; email: string } } | null;
} = { value: null };

vi.mock('@/lib/auth/session', () => ({
  requireSession: () => {
    if (!sessionRef.value) return Promise.reject(new Error('UNAUTHENTICATED'));
    return Promise.resolve(sessionRef.value);
  },
}));

import { markNotificationReadAction } from '../markNotificationReadAction';
import { markAllReadAction } from '../markAllReadAction';

let db: PgliteDB;

async function seedNotif(
  userId: string,
  workspaceId: string,
): Promise<string> {
  const id = randomUUID();
  await db.insert(notifTable).values({
    id,
    userId,
    workspaceId,
    type: 'bid.submitted',
    title: 't',
    body: 'b',
    channel: 'in_app',
    status: 'queued',
  });
  return id;
}

describe('markNotificationReadAction', () => {
  beforeEach(async () => {
    db = await setupNotifActionEnv();
  });
  afterEach(() => {
    teardownNotifActionEnv();
    sessionRef.value = null;
  });

  it('rejects without session', async () => {
    const r = await markNotificationReadAction({ notificationId: randomUUID() });
    expect(r.ok).toBe(false);
  });

  it('marks own notification as read', async () => {
    const u = await seedUser(db, { email: 'u@x.com' });
    const ws = await seedBuyerWorkspace(db);
    await seedMembership(db, ws.id, u.id, 'admin');
    const nid = await seedNotif(u.id, ws.id);

    sessionRef.value = { user: { id: u.id, email: u.email } };
    const r = await markNotificationReadAction({ notificationId: nid });
    expect(r.ok).toBe(true);

    const [row] = await db
      .select()
      .from(notifTable)
      .where(eq(notifTable.id, nid));
    expect(row.status).toBe('read');
    expect(row.readAt).not.toBeNull();
  });

  it("rejects another user's notification with NOT_FOUND (not 403)", async () => {
    const u1 = await seedUser(db, { email: 'u1@x.com' });
    const u2 = await seedUser(db, { email: 'u2@x.com' });
    const ws = await seedBuyerWorkspace(db);
    await seedMembership(db, ws.id, u1.id, 'admin');
    await seedMembership(db, ws.id, u2.id, 'member');
    const nid = await seedNotif(u1.id, ws.id);

    sessionRef.value = { user: { id: u2.id, email: u2.email } };
    const r = await markNotificationReadAction({ notificationId: nid });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('NOT_FOUND');

    // Row remains unread.
    const [row] = await db
      .select()
      .from(notifTable)
      .where(eq(notifTable.id, nid));
    expect(row.status).toBe('queued');
  });
});

describe('markAllReadAction', () => {
  beforeEach(async () => {
    db = await setupNotifActionEnv();
  });
  afterEach(() => {
    teardownNotifActionEnv();
    sessionRef.value = null;
  });

  it('rejects without session', async () => {
    const r = await markAllReadAction();
    expect(r.ok).toBe(false);
  });

  it('marks all unread for the caller, leaves others alone', async () => {
    const u1 = await seedUser(db, { email: 'u1@x.com' });
    const u2 = await seedUser(db, { email: 'u2@x.com' });
    const ws = await seedBuyerWorkspace(db);
    await seedMembership(db, ws.id, u1.id, 'admin');
    await seedMembership(db, ws.id, u2.id, 'member');

    await seedNotif(u1.id, ws.id);
    await seedNotif(u1.id, ws.id);
    await seedNotif(u2.id, ws.id);

    sessionRef.value = { user: { id: u1.id, email: u1.email } };
    const r = await markAllReadAction();
    expect(r.ok).toBe(true);

    const u1Read = await db
      .select()
      .from(notifTable)
      .where(
        and(
          eq(notifTable.userId, u1.id),
          isNotNull(notifTable.readAt),
        ),
      );
    expect(u1Read).toHaveLength(2);

    const u2Rows = await db
      .select()
      .from(notifTable)
      .where(eq(notifTable.userId, u2.id));
    expect(u2Rows[0].readAt).toBeNull();
    expect(u2Rows[0].status).toBe('queued');
  });
});

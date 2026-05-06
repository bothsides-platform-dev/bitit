import { describe, expect, it, beforeEach } from 'vitest';
import { createPgliteDb } from '@/lib/db/client-pglite';
import { DrizzleWorkspaceRepository } from '../workspace';
import type { User } from '@/lib/types/user';
import { seedPgWorkspace, seedUser } from './_seed';

function makeUser(id: string, email: string, role: User['role'] = 'member'): User {
  return {
    id,
    name: 'Test',
    email,
    avatarColor: 'ink',
    role,
    status: 'active',
    joinedAt: new Date().toISOString(),
  };
}

describe('DrizzleWorkspaceRepository', () => {
  let repo: DrizzleWorkspaceRepository;
  let db: Awaited<ReturnType<typeof createPgliteDb>>;

  beforeEach(async () => {
    db = await createPgliteDb();
    repo = new DrizzleWorkspaceRepository(db);
  });

  it('auto-joins PG user matching email domain', async () => {
    const ws = await seedPgWorkspace(db, 'toss.im', { name: '토스페이먼츠' });
    const u = await seedUser(db, { email: 'sales@toss.im' });
    const joined = await repo.autoJoinPg('sales@toss.im', makeUser(u.id, u.email));
    expect(joined).not.toBeNull();
    expect(joined!.id).toBe(ws.id);
    expect(joined!.members.some((m) => m.id === u.id)).toBe(true);
  });

  it('returns null for unregistered domain', async () => {
    const u = await seedUser(db, { email: 'ceo@kakao.com' });
    expect(
      await repo.autoJoinPg('ceo@kakao.com', makeUser(u.id, u.email)),
    ).toBeNull();
  });

  it('does not duplicate member on re-join', async () => {
    await seedPgWorkspace(db, 'toss.im');
    const u = await seedUser(db, { email: 'sales@toss.im' });
    const user = makeUser(u.id, u.email);
    await repo.autoJoinPg('sales@toss.im', user);
    await repo.autoJoinPg('sales@toss.im', user);
    const ws = await repo.findByDomain('toss.im');
    expect(ws!.members.filter((m) => m.id === u.id)).toHaveLength(1);
  });

  it('findByDomain returns undefined for unknown domain', async () => {
    expect(await repo.findByDomain('stripe.com')).toBeUndefined();
  });

  it('findById hydrates members and biz profile when present', async () => {
    const ws = await seedPgWorkspace(db, 'toss.im', { name: '토스' });
    const u = await seedUser(db, { email: 'a@toss.im' });
    await repo.autoJoinPg('a@toss.im', makeUser(u.id, u.email, 'admin'));
    const fetched = await repo.findById(ws.id);
    expect(fetched).toBeDefined();
    expect(fetched!.type).toBe('pg');
    expect(fetched!.domain).toBe('toss.im');
    expect(fetched!.members[0].role).toBe('admin');
  });
});

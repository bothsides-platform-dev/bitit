import { describe, expect, it, beforeEach } from 'vitest';
import { InMemoryWorkspaceRepository } from '../repositories/in-memory/workspace';
import type { Workspace } from '@/lib/types/workspace';
import type { User } from '@/lib/types/user';

function makeWorkspace(overrides?: Partial<Workspace>): Workspace {
  return {
    id: 'ws-toss',
    type: 'pg',
    name: '토스페이먼츠',
    domain: 'toss.im',
    members: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeUser(id: string, email: string): User {
  return {
    id,
    name: 'Test',
    email,
    avatarColor: 'ink',
    role: 'member',
    status: 'active',
    joinedAt: new Date().toISOString(),
  };
}

describe('InMemoryWorkspaceRepository', () => {
  let repo: InMemoryWorkspaceRepository;

  beforeEach(() => {
    repo = new InMemoryWorkspaceRepository();
  });

  it('auto-joins PG user matching email domain', async () => {
    await repo.save(makeWorkspace());
    const joined = await repo.autoJoinPg('sales@toss.im', makeUser('u1', 'sales@toss.im'));
    expect(joined).not.toBeNull();
    expect(joined!.members.some((m) => m.id === 'u1')).toBe(true);
  });

  it('returns null for unregistered domain', async () => {
    expect(await repo.autoJoinPg('ceo@kakao.com', makeUser('u2', 'ceo@kakao.com'))).toBeNull();
  });

  it('does not duplicate member on re-join', async () => {
    await repo.save(makeWorkspace());
    const user = makeUser('u1', 'sales@toss.im');
    await repo.autoJoinPg('sales@toss.im', user);
    await repo.autoJoinPg('sales@toss.im', user);
    expect((await repo.findByDomain('toss.im'))!.members.filter((m) => m.id === 'u1')).toHaveLength(1);
  });

  it('findByDomain returns undefined for unknown domain', async () => {
    expect(await repo.findByDomain('stripe.com')).toBeUndefined();
  });
});

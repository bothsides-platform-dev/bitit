import { describe, expect, it, beforeEach } from 'vitest';
import { InMemoryWorkspaceRepository } from '../repositories/in-memory/workspace';
import type { Workspace } from '@/lib/types/workspace';
import type { User } from '@/lib/types/user';

function makeWorkspace(overrides?: Partial<Workspace>): Workspace {
  return {
    id: 'ws-toss',
    type: 'pg',
    name: '토스페이먼츠',
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

  it('save and findById returns the workspace', async () => {
    const ws = makeWorkspace();
    await repo.save(ws);
    const found = await repo.findById(ws.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe(ws.name);
  });

  it('findById returns undefined for unknown id', async () => {
    expect(await repo.findById('unknown-id')).toBeUndefined();
  });

  it('save with members stores members', async () => {
    const user = makeUser('u1', 'sales@toss.im');
    const ws = makeWorkspace({ members: [user] });
    await repo.save(ws);
    const found = await repo.findById(ws.id);
    expect(found!.members.some((m) => m.id === 'u1')).toBe(true);
  });
});

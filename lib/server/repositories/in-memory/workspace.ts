import type { Workspace } from '@/lib/types/workspace';
import type { User } from '@/lib/types/user';
import type { WorkspaceRepo, Tx } from '../types';

export class InMemoryWorkspaceRepository implements WorkspaceRepo {
  private store = new Map<string, Workspace>();

  async save(ws: Workspace, _tx?: Tx): Promise<void> {
    void _tx;
    this.store.set(ws.id, { ...ws, members: [...ws.members] });
  }

  async findById(id: string, _tx?: Tx): Promise<Workspace | undefined> {
    void _tx;
    const ws = this.store.get(id);
    return ws ? { ...ws, members: [...ws.members] } : undefined;
  }

  async findByDomain(domain: string, _tx?: Tx): Promise<Workspace | undefined> {
    void _tx;
    const ws = [...this.store.values()].find((w) => w.domain === domain);
    return ws ? { ...ws, members: [...ws.members] } : undefined;
  }

  // PG workspace identity = email domain; auto-merges on signup. Does NOT create.
  async autoJoinPg(
    userEmail: string,
    user: User,
    _tx?: Tx,
  ): Promise<Workspace | null> {
    void _tx;
    const domain = userEmail.split('@')[1];
    if (!domain) return null;

    const existing = [...this.store.values()].find((w) => w.domain === domain);
    if (!existing) return null;
    if (existing.members.some((m) => m.id === user.id)) {
      return { ...existing, members: [...existing.members] };
    }

    const updated: Workspace = {
      ...existing,
      members: [...existing.members, user],
    };
    this.store.set(existing.id, updated);
    return { ...updated, members: [...updated.members] };
  }

  clear(): void {
    this.store.clear();
  }
}

import type { Workspace } from '@/lib/types/workspace';
import type { User } from '@/lib/types/user';

export class InMemoryWorkspaceRepository {
  private store = new Map<string, Workspace>();

  save(ws: Workspace): void {
    this.store.set(ws.id, { ...ws, members: [...ws.members] });
  }

  findById(id: string): Workspace | undefined {
    const ws = this.store.get(id);
    return ws ? { ...ws, members: [...ws.members] } : undefined;
  }

  findByDomain(domain: string): Workspace | undefined {
    const ws = [...this.store.values()].find(w => w.domain === domain);
    return ws ? { ...ws, members: [...ws.members] } : undefined;
  }

  // PG workspace identity = email domain; auto-merges on signup.
  autoJoinPg(userEmail: string, user: User): Workspace | null {
    const domain = userEmail.split('@')[1];
    if (!domain) return null;

    const existing = this.store.get(
      [...this.store.values()].find(w => w.domain === domain)?.id ?? '',
    );
    if (!existing) return null;
    if (existing.members.some(m => m.id === user.id)) {
      return { ...existing, members: [...existing.members] };
    }

    const updated: Workspace = { ...existing, members: [...existing.members, user] };
    this.store.set(existing.id, updated);
    return { ...updated, members: [...updated.members] };
  }

  clear(): void {
    this.store.clear();
  }
}

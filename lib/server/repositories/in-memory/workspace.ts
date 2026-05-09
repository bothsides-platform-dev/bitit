import type { Workspace } from '@/lib/types/workspace';
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

  clear(): void {
    this.store.clear();
  }
}

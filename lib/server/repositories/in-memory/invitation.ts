import type { RfqInvitation } from '@/lib/types/invitation';
import { hashToken, isExpired } from '../../token';
import type { InvitationRepo, TokenClaimResult, Tx } from '../types';

export class InMemoryInvitationRepository implements InvitationRepo {
  private store = new Map<string, RfqInvitation>();
  private tokenHashIndex = new Map<string, string>(); // hash → id

  async save(inv: RfqInvitation, rawToken: string, _tx?: Tx): Promise<void> {
    void _tx;
    this.store.set(inv.id, { ...inv });
    this.tokenHashIndex.set(hashToken(rawToken), inv.id);
  }

  async findById(id: string, _tx?: Tx): Promise<RfqInvitation | undefined> {
    void _tx;
    const inv = this.store.get(id);
    return inv ? { ...inv } : undefined;
  }

  async findByRfq(rfqId: string, _tx?: Tx): Promise<RfqInvitation[]> {
    void _tx;
    return [...this.store.values()]
      .filter((i) => i.rfqId === rfqId)
      .map((i) => ({ ...i }));
  }

  async claimToken(
    rawToken: string,
    userId: string,
    _tx?: Tx,
  ): Promise<TokenClaimResult> {
    void _tx;
    const hash = hashToken(rawToken);
    const id = this.tokenHashIndex.get(hash);
    if (!id) return { ok: false, reason: 'invalid' };

    const inv = this.store.get(id)!;
    if (isExpired(inv.expiresAt)) return { ok: false, reason: 'expired' };
    if (inv.acceptedByUserId) return { ok: false, reason: 'used' };

    const updated: RfqInvitation = {
      ...inv,
      acceptedByUserId: userId,
      status: 'accepted',
    };
    this.store.set(id, updated);
    return { ok: true, invitation: { ...updated } };
  }

  // Only the user who accepted the token has access — same-domain peers blocked.
  async canAccess(rfqId: string, userId: string, _tx?: Tx): Promise<boolean> {
    void _tx;
    return [...this.store.values()].some(
      (i) => i.rfqId === rfqId && i.acceptedByUserId === userId,
    );
  }

  clear(): void {
    this.store.clear();
    this.tokenHashIndex.clear();
  }
}

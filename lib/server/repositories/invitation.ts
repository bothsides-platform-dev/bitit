import type { RfqInvitation } from '@/lib/types/invitation';
import { hashToken, isExpired } from '../token';

export type TokenClaimResult =
  | { ok: true; invitation: RfqInvitation }
  | { ok: false; reason: 'expired' | 'used' | 'invalid' };

export class InMemoryInvitationRepository {
  private store = new Map<string, RfqInvitation>();
  private tokenHashIndex = new Map<string, string>(); // hash → id

  save(inv: RfqInvitation, rawToken: string): void {
    this.store.set(inv.id, { ...inv });
    this.tokenHashIndex.set(hashToken(rawToken), inv.id);
  }

  findById(id: string): RfqInvitation | undefined {
    const inv = this.store.get(id);
    return inv ? { ...inv } : undefined;
  }

  findByRfq(rfqId: string): RfqInvitation[] {
    return [...this.store.values()].filter(i => i.rfqId === rfqId).map(i => ({ ...i }));
  }

  claimToken(rawToken: string, userId: string): TokenClaimResult {
    const hash = hashToken(rawToken);
    const id = this.tokenHashIndex.get(hash);
    if (!id) return { ok: false, reason: 'invalid' };

    const inv = this.store.get(id)!;
    if (isExpired(inv.expiresAt)) return { ok: false, reason: 'expired' };
    if (inv.acceptedByUserId) return { ok: false, reason: 'used' };

    const updated: RfqInvitation = { ...inv, acceptedByUserId: userId, status: 'accepted' };
    this.store.set(id, updated);
    return { ok: true, invitation: { ...updated } };
  }

  // Only the user who accepted the token has access — same-domain peers are explicitly blocked.
  canAccess(rfqId: string, userId: string): boolean {
    return [...this.store.values()].some(
      i => i.rfqId === rfqId && i.acceptedByUserId === userId,
    );
  }

  clear(): void {
    this.store.clear();
    this.tokenHashIndex.clear();
  }
}

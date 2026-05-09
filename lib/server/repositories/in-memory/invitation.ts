import type { RfqInvitation } from '@/lib/types/invitation';
import type { RFQ } from '@/lib/types/rfq';
import { hashToken, isExpired } from '../../token';
import type { InvitationRepo, RfqRepo, TokenClaimResult, Tx } from '../types';

export class InMemoryInvitationRepository implements InvitationRepo {
  private store = new Map<string, RfqInvitation>();
  private tokenHashIndex = new Map<string, string>(); // hash → id
  // Optional getter for the RFQ repo so findByPgUser can hydrate the JOIN
  // shape without inverting factory ordering. Wired by the factory; tests
  // that only exercise invitation-only methods can leave it unset.
  private rfqRepoRef?: () => RfqRepo;

  setRfqRepoRef(getter: () => RfqRepo): void {
    this.rfqRepoRef = getter;
  }

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

  async findDraftsByRfq(rfqId: string, _tx?: Tx): Promise<RfqInvitation[]> {
    void _tx;
    return [...this.store.values()]
      .filter((i) => i.rfqId === rfqId && i.status === 'draft')
      .map((i) => ({ ...i }));
  }

  async findByTokenHash(
    tokenHash: string,
    _tx?: Tx,
  ): Promise<RfqInvitation | undefined> {
    void _tx;
    const id = this.tokenHashIndex.get(tokenHash);
    if (!id) return undefined;
    const inv = this.store.get(id);
    return inv ? { ...inv } : undefined;
  }

  async findByPgUser(
    userId: string,
    _tx?: Tx,
  ): Promise<{ invitation: RfqInvitation; rfq: RFQ }[]> {
    void _tx;
    if (!this.rfqRepoRef) return [];
    const rfqRepo = this.rfqRepoRef();
    const claimed = [...this.store.values()].filter(
      (i) => i.acceptedByUserId === userId,
    );
    const out: { invitation: RfqInvitation; rfq: RFQ }[] = [];
    for (const inv of claimed) {
      const rfq = await rfqRepo.findById(inv.rfqId);
      if (rfq) out.push({ invitation: { ...inv }, rfq });
    }
    return out;
  }

  async findByPgWorkspace(
    pgWsId: string,
    _tx?: Tx,
  ): Promise<{ invitation: RfqInvitation; rfq: RFQ }[]> {
    void _tx;
    if (!this.rfqRepoRef) return [];
    const rfqRepo = this.rfqRepoRef();
    const active = [...this.store.values()].filter(
      (i) =>
        i.pgWsId === pgWsId &&
        (i.status === 'sent' || i.status === 'opened' || i.status === 'accepted'),
    );
    const out: { invitation: RfqInvitation; rfq: RFQ }[] = [];
    for (const inv of active) {
      const rfq = await rfqRepo.findById(inv.rfqId);
      if (rfq) out.push({ invitation: { ...inv }, rfq });
    }
    return out;
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

  async markOpened(
    invitationId: string,
    openedAt: Date,
    _tx?: Tx,
  ): Promise<void> {
    void _tx;
    const inv = this.store.get(invitationId);
    if (!inv) return;
    if (inv.status !== 'accepted') return;
    this.store.set(invitationId, {
      ...inv,
      status: 'opened',
      openedAt: openedAt.toISOString(),
    });
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

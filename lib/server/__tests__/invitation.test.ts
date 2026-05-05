import { describe, expect, it, beforeEach } from 'vitest';
import { InMemoryInvitationRepository } from '../repositories/invitation';
import { generateToken, addMinutes } from '../token';
import type { RfqInvitation } from '@/lib/types/invitation';

function makeInvitation(rawToken: string, overrides?: Partial<RfqInvitation>): RfqInvitation {
  return {
    id: 'inv-1',
    rfqId: 'rfq-1',
    pgEmail: 'sales@toss.im',
    uniqueToken: rawToken,
    sentAt: new Date().toISOString(),
    expiresAt: addMinutes(new Date(), 7 * 24 * 60),
    status: 'sent',
    ...overrides,
  };
}

describe('InMemoryInvitationRepository', () => {
  let repo: InMemoryInvitationRepository;

  beforeEach(() => {
    repo = new InMemoryInvitationRepository();
  });

  it('claims a valid token and sets acceptedByUserId', () => {
    const raw = generateToken();
    repo.save(makeInvitation(raw), raw);

    const result = repo.claimToken(raw, 'user-pg');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.invitation.acceptedByUserId).toBe('user-pg');
      expect(result.invitation.status).toBe('accepted');
    }
  });

  it('returns invalid for unknown token', () => {
    const result = repo.claimToken('unknown', 'user-pg');
    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('returns expired for past expiresAt', () => {
    const raw = generateToken();
    repo.save(
      makeInvitation(raw, { expiresAt: new Date(Date.now() - 1000).toISOString() }),
      raw,
    );
    expect(repo.claimToken(raw, 'user-pg')).toEqual({ ok: false, reason: 'expired' });
  });

  it('returns used when acceptedByUserId already set', () => {
    const raw = generateToken();
    repo.save(makeInvitation(raw, { acceptedByUserId: 'prev-user' }), raw);
    expect(repo.claimToken(raw, 'user-pg')).toEqual({ ok: false, reason: 'used' });
  });

  it('second claim returns used', () => {
    const raw = generateToken();
    repo.save(makeInvitation(raw), raw);
    repo.claimToken(raw, 'user-1');
    expect(repo.claimToken(raw, 'user-2')).toEqual({ ok: false, reason: 'used' });
  });

  it('canAccess is true only for the accepting user (same-domain peers blocked)', () => {
    const raw = generateToken();
    repo.save(makeInvitation(raw), raw);
    repo.claimToken(raw, 'user-pg');

    expect(repo.canAccess('rfq-1', 'user-pg')).toBe(true);
    expect(repo.canAccess('rfq-1', 'other-pg-user')).toBe(false);
  });
});

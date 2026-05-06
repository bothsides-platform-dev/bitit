// Race + happy-path coverage for the atomic UPDATE WHERE used by every
// auth verification flow. Models the same Promise.allSettled pattern as
// invitation.test.ts so that two concurrent consume() calls cannot both win.
import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';

import { createPgliteDb } from '@/lib/db/client-pglite';
import { DrizzleVerificationTokenRepository } from '../verification-token';
import { addMinutes, generateToken, hashToken } from '../../../token';

async function setup() {
  const db = await createPgliteDb();
  const repo = new DrizzleVerificationTokenRepository(db);
  return { db, repo };
}

function makeToken(rawToken: string, overrides?: Partial<{
  purpose: 'signup_email' | 'password_reset' | 'email_change';
  email: string;
  expiresAt: string;
  meta: Record<string, unknown>;
}>) {
  return {
    id: randomUUID(),
    purpose: (overrides?.purpose ?? 'signup_email') as
      | 'signup_email'
      | 'password_reset'
      | 'email_change',
    email: overrides?.email ?? 'kim@toss.im',
    tokenHash: hashToken(rawToken),
    issuedAt: new Date().toISOString(),
    expiresAt: overrides?.expiresAt ?? addMinutes(new Date(), 15),
    meta: overrides?.meta,
  };
}

describe('DrizzleVerificationTokenRepository', () => {
  it('consume returns the row exactly once and rejects reuse', async () => {
    const { repo } = await setup();
    const raw = generateToken();
    await repo.save(makeToken(raw));

    const first = await repo.consume(hashToken(raw), new Date());
    expect(first?.email).toBe('kim@toss.im');
    const second = await repo.consume(hashToken(raw), new Date());
    expect(second).toBeUndefined();
  });

  it('consume rejects expired tokens', async () => {
    const { repo } = await setup();
    const raw = generateToken();
    await repo.save(
      makeToken(raw, {
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      }),
    );
    const r = await repo.consume(hashToken(raw), new Date());
    expect(r).toBeUndefined();
  });

  it('parallel consume: one wins, the other returns undefined', async () => {
    const { repo } = await setup();
    const raw = generateToken();
    await repo.save(makeToken(raw));

    const settled = await Promise.allSettled([
      repo.consume(hashToken(raw), new Date()),
      repo.consume(hashToken(raw), new Date()),
    ]);
    const results = settled
      .filter(
        (r): r is PromiseFulfilledResult<
          Awaited<ReturnType<typeof repo.consume>>
        > => r.status === 'fulfilled',
      )
      .map((r) => r.value);
    const wins = results.filter((r) => r !== undefined);
    const losses = results.filter((r) => r === undefined);
    expect(wins).toHaveLength(1);
    expect(losses).toHaveLength(1);
  });

  it('findValid returns the token until consumed', async () => {
    const { repo } = await setup();
    const raw = generateToken();
    await repo.save(makeToken(raw, { meta: { inviteToken: 'abc' } }));

    const before = await repo.findValid(hashToken(raw), new Date());
    expect(before?.meta).toEqual({ inviteToken: 'abc' });
    await repo.consume(hashToken(raw), new Date());
    const after = await repo.findValid(hashToken(raw), new Date());
    expect(after).toBeUndefined();
  });
});

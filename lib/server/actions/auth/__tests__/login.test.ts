import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupActionEnv, teardownActionEnv } from './_setup';

// Auth.js's signIn() reaches for the production postgres client unless
// stubbed. We mock the entire `@/auth` surface — the action only depends on
// `signIn`, so no other exports need to round-trip.
const signInMock = vi.fn();
vi.mock('@/auth', () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
  // `auth`, `signOut`, `handlers` aren't called from loginAction; provide
  // shells so any indirect import (transitive `require.cache`) resolves.
  auth: () => Promise.resolve(null),
  signOut: () => Promise.resolve(),
  handlers: { GET: undefined, POST: undefined },
}));

import { loginAction } from '../loginAction';

describe('loginAction', () => {
  beforeEach(async () => {
    await setupActionEnv();
    signInMock.mockReset();
  });
  afterEach(teardownActionEnv);

  it('returns ok:true when Auth.js signIn resolves', async () => {
    signInMock.mockResolvedValue(undefined);
    const r = await loginAction({
      email: 'Kim@Example.com',
      password: 'Password123!',
    });
    expect(r.ok).toBe(true);
    expect(signInMock).toHaveBeenCalledWith('credentials', {
      email: 'kim@example.com',
      password: 'Password123!',
      redirect: false,
    });
  });

  it('returns ok:false when signIn throws', async () => {
    signInMock.mockRejectedValue(new Error('CredentialsSignin'));
    const r = await loginAction({
      email: 'kim@example.com',
      password: 'wrong',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('INVALID_CREDENTIALS');
  });

  it('rejects malformed input before reaching signIn', async () => {
    const r = await loginAction({
      email: 'not-an-email',
      password: '',
    });
    expect(r.ok).toBe(false);
    expect(signInMock).not.toHaveBeenCalled();
  });
});

'use server';

import { getVerificationTokenRepo } from '@/lib/server/repositories/factory';
import { hashToken } from '@/lib/server/token';
import type { AuthActionResult } from './_shared';

export type VerifyEmailResult = AuthActionResult<{
  email: string;
  inviteToken?: string;
  workspaceType?: 'buyer' | 'pg';
}>;

/**
 * P4 — atomic consume of a signup_email verification token.
 *
 * Returns `{ ok: true, email, inviteToken? }` on success so the client can
 * stash both back into sessionStorage and choose the right next step.
 *
 * The verification-token repo's UPDATE WHERE … AND consumed_at IS NULL AND
 * expires_at > now() is the race-safe surface; a second call with the same
 * raw token returns `undefined` (covered by verification-token.test.ts).
 */
export async function verifyEmailAction(
  rawToken: string,
): Promise<VerifyEmailResult> {
  if (!rawToken || typeof rawToken !== 'string') {
    return { ok: false, error: 'INVALID_TOKEN' };
  }

  const repo = await getVerificationTokenRepo();
  const consumed = await repo.consume(hashToken(rawToken), new Date());
  if (!consumed) {
    return { ok: false, error: 'TOKEN_INVALID_OR_EXPIRED' };
  }
  if (consumed.purpose !== 'signup_email') {
    return { ok: false, error: 'WRONG_PURPOSE' };
  }

  const meta = consumed.meta && typeof consumed.meta === 'object'
    ? (consumed.meta as Record<string, unknown>)
    : {};

  const inviteToken = meta.inviteToken;
  const rawWorkspaceType = meta.workspaceType;

  return {
    ok: true,
    email: consumed.email,
    inviteToken: typeof inviteToken === 'string' ? inviteToken : undefined,
    workspaceType:
      rawWorkspaceType === 'buyer' || rawWorkspaceType === 'pg'
        ? rawWorkspaceType
        : undefined,
  };
}

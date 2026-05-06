'use server';

import { z } from 'zod';
import { randomUUID } from 'node:crypto';

import {
  getOutboxRepo,
  getVerificationTokenRepo,
} from '@/lib/server/repositories/factory';
import { addMinutes, generateToken, hashToken } from '@/lib/server/token';
import {
  baseUrl,
  bucket15Min,
  devLogVerifyLink,
  normalizeEmail,
  type AuthActionResult,
} from './_shared';

const Input = z.object({
  email: z.string().email(),
  inviteToken: z.string().min(1).max(256).optional(),
});

export type SignupEmailInput = z.infer<typeof Input>;
export type SignupEmailResult = AuthActionResult<{ email: string }>;

/**
 * P2 — issue a signup_email verification token and enqueue the outbox mail.
 *
 * - Token TTL: 15 minutes.
 * - meta.inviteToken (if present) is the only carrier of the RFQ invite
 *   across the verify hop — the client puts it back into sessionStorage
 *   from `verifyEmailAction`'s response.
 * - Outbox dedupe key bucketed per 15-minute window so resend taps in the
 *   same window collapse to one outbox row.
 */
export async function signupEmailAction(
  input: SignupEmailInput,
): Promise<SignupEmailResult> {
  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const email = normalizeEmail(parsed.data.email);
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = addMinutes(new Date(), 15);

  const verifications = await getVerificationTokenRepo();
  await verifications.save({
    id: randomUUID(),
    purpose: 'signup_email',
    email,
    tokenHash,
    issuedAt: new Date().toISOString(),
    expiresAt,
    meta: parsed.data.inviteToken
      ? { inviteToken: parsed.data.inviteToken }
      : undefined,
  });

  const verifyUrl = `${baseUrl()}/auth/verify?token=${rawToken}`;
  devLogVerifyLink('signup-verify', verifyUrl);

  const outbox = await getOutboxRepo();
  await outbox.enqueue({
    event: 'auth.verify',
    to: email,
    // Step 10 replaces subject/html with a real template.
    subject: '인증 메일',
    html: `<a href="${verifyUrl}">인증하기</a>`,
    dedupeKey: `signup-verify:${email}:${bucket15Min()}`,
  });

  return { ok: true, email };
}

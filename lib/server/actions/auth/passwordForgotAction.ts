'use server';

import { z } from 'zod';
import { randomUUID } from 'node:crypto';

import {
  getOutboxRepo,
  getUserRepo,
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

const Input = z.object({ email: z.string().email() });

export type PasswordForgotInput = z.infer<typeof Input>;
export type PasswordForgotResult = AuthActionResult;

/**
 * P7 — issue a password_reset token. **Always** returns `{ ok: true }` so an
 * attacker can't probe which addresses have accounts. Token + outbox row are
 * only created if the email matches a real user.
 *
 * Token TTL: 30 minutes.
 */
export async function passwordForgotAction(
  input: PasswordForgotInput,
): Promise<PasswordForgotResult> {
  const parsed = Input.safeParse(input);
  if (!parsed.success) {
    // Even on input error keep the response shape uniform — never leak.
    return { ok: true };
  }
  const email = normalizeEmail(parsed.data.email);

  const userRepo = await getUserRepo();
  const user = await userRepo.findByEmail(email);
  if (!user) return { ok: true };

  const rawToken = generateToken();
  const verifications = await getVerificationTokenRepo();
  await verifications.save({
    id: randomUUID(),
    purpose: 'password_reset',
    email,
    tokenHash: hashToken(rawToken),
    issuedAt: new Date().toISOString(),
    expiresAt: addMinutes(new Date(), 30),
  });

  const resetUrl = `${baseUrl()}/password/reset?token=${rawToken}`;
  devLogVerifyLink('password-reset', resetUrl);

  const outbox = await getOutboxRepo();
  await outbox.enqueue({
    event: 'auth.reset',
    to: email,
    subject: '비밀번호 재설정',
    html: `<a href="${resetUrl}">재설정하기</a>`,
    dedupeKey: `password-reset:${email}:${bucket15Min()}`,
  });

  return { ok: true };
}

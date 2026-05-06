'use server';

import { z } from 'zod';
import { randomUUID } from 'node:crypto';

import { requireSession } from '@/lib/auth/session';
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

const Input = z.object({ newEmail: z.string().email() });

export type EmailChangeRequestInput = z.infer<typeof Input>;
export type EmailChangeRequestResult = AuthActionResult;

/**
 * P10 — kick off email change. Authenticated session required. The token is
 * issued against the *current* user's primary email (where the confirmation
 * link is sent — wait, no: the user can confirm via the new address).
 *
 * The verification row stores `email = newEmail` so the token is bound to the
 * destination address; meta carries the user's id so the confirm step can
 * update the right row even if the user changed identity.
 *
 * Token TTL: 24 hours.
 */
export async function emailChangeRequestAction(
  input: EmailChangeRequestInput,
): Promise<EmailChangeRequestResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: 'UNAUTHENTICATED' };

  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const newEmail = normalizeEmail(parsed.data.newEmail);
  const rawToken = generateToken();
  const verifications = await getVerificationTokenRepo();
  await verifications.save({
    id: randomUUID(),
    purpose: 'email_change',
    email: newEmail,
    tokenHash: hashToken(rawToken),
    issuedAt: new Date().toISOString(),
    expiresAt: addMinutes(new Date(), 24 * 60),
    meta: { userId: session.user.id, newEmail },
  });

  const confirmUrl = `${baseUrl()}/auth/email-change?token=${rawToken}`;
  devLogVerifyLink('email-change', confirmUrl);

  const outbox = await getOutboxRepo();
  await outbox.enqueue({
    event: 'auth.email-change',
    to: newEmail,
    subject: '이메일 변경 확인',
    html: `<a href="${confirmUrl}">확인하기</a>`,
    dedupeKey: `email-change:${session.user.id}:${newEmail}:${bucket15Min()}`,
  });

  return { ok: true };
}

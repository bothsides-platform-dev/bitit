'use server';

import { z } from 'zod';
import { signIn } from '@/auth';
import { normalizeEmail, type AuthActionResult } from './_shared';

const Input = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export type LoginInput = z.infer<typeof Input>;
export type LoginResult = AuthActionResult<{ email: string }>;

/**
 * P1 — wrap Auth.js v5 signIn('credentials', { redirect: false }).
 *
 * On success the cookie is set server-side by Auth.js; the client just calls
 * router.push(next || '/home'). Failures bubble up as `ok: false` so the form
 * can render an error without a 302 round-trip.
 */
export async function loginAction(input: LoginInput): Promise<LoginResult> {
  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const email = normalizeEmail(parsed.data.email);
  try {
    await signIn('credentials', {
      email,
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true, email };
  } catch (e) {
    // Auth.js throws CredentialsSignin / AccessDenied for bad creds. Surface
    // a single generic error to avoid leaking which half of the pair was
    // wrong (matches the "single failure mode" UX in P1).
    void e;
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }
}

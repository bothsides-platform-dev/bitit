import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { outboxEntries, users } from '@/lib/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { passwordForgotAction } from '../passwordForgotAction';
import { passwordResetAction } from '../passwordResetAction';
import { setupActionEnv, teardownActionEnv } from './_setup';
import type { PgliteDB } from '@/lib/db/client-pglite';

let db: PgliteDB;

async function seedUser(email: string, plainPassword = 'OldPassword1!'): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    email,
    passwordHash: await hashPassword(plainPassword),
    name: 'tester',
    avatarColor: 'ink',
  });
  return id;
}

function tokenFromOutbox(html: string): string {
  return decodeURIComponent(html.match(/token=([^"]+)"/)?.[1] ?? '');
}

describe('passwordForgotAction', () => {
  beforeEach(async () => {
    db = await setupActionEnv();
  });
  afterEach(teardownActionEnv);

  it('always returns ok:true even when the email does not exist', async () => {
    const r = await passwordForgotAction({ email: 'unknown@nope.com' });
    expect(r).toEqual({ ok: true });

    // No outbox row, no verification token issued — silent.
    const out = await db.select().from(outboxEntries);
    expect(out).toHaveLength(0);
  });

  it('issues a token + outbox row when the email matches a real user', async () => {
    await seedUser('kim@example.com');
    const r = await passwordForgotAction({ email: 'Kim@example.com' });
    expect(r.ok).toBe(true);

    const out = await db
      .select()
      .from(outboxEntries)
      .where(eq(outboxEntries.toAddr, 'kim@example.com'));
    expect(out).toHaveLength(1);
    expect(out[0].event).toBe('auth.reset');
  });
});

describe('passwordResetAction', () => {
  beforeEach(async () => {
    db = await setupActionEnv();
  });
  afterEach(teardownActionEnv);

  it('updates the password hash on success', async () => {
    const userId = await seedUser('kim@example.com');
    await passwordForgotAction({ email: 'kim@example.com' });

    const rows = await db
      .select({ html: outboxEntries.html })
      .from(outboxEntries)
      .where(eq(outboxEntries.event, 'auth.reset'))
      .limit(1);
    const token = tokenFromOutbox(rows[0].html);

    const r = await passwordResetAction({
      rawToken: token,
      password: 'NewPassword2@',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.email).toBe('kim@example.com');
    expect(r.password).toBe('NewPassword2@');

    const [u] = await db.select().from(users).where(eq(users.id, userId));
    expect(await verifyPassword('NewPassword2@', u.passwordHash)).toBe(true);
    expect(await verifyPassword('OldPassword1!', u.passwordHash)).toBe(false);
  });

  it('rejects a reused token', async () => {
    await seedUser('kim@example.com');
    await passwordForgotAction({ email: 'kim@example.com' });
    const rows = await db
      .select({ html: outboxEntries.html })
      .from(outboxEntries)
      .where(eq(outboxEntries.event, 'auth.reset'))
      .limit(1);
    const token = tokenFromOutbox(rows[0].html);

    const first = await passwordResetAction({
      rawToken: token,
      password: 'NewPassword2@',
    });
    expect(first.ok).toBe(true);
    const second = await passwordResetAction({
      rawToken: token,
      password: 'AnotherPass3#',
    });
    expect(second.ok).toBe(false);
  });

  it('rejects an unknown token', async () => {
    const r = await passwordResetAction({
      rawToken: 'nope-not-real',
      password: 'NewPassword2@',
    });
    expect(r.ok).toBe(false);
  });
});

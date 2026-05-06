import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../password';

describe('password (bcryptjs cost=12)', () => {
  it('hashes and verifies a correct password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
  }, 10_000);

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('s3cret-Password!');
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  }, 10_000);

  it('produces a new salt for the same input', async () => {
    const a = await hashPassword('same-input');
    const b = await hashPassword('same-input');
    expect(a).not.toBe(b);
  }, 15_000);
});

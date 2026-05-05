import { describe, expect, it } from 'vitest';
import { generateToken, hashToken, isExpired, addMinutes } from '../token';

describe('generateToken', () => {
  it('returns a URL-safe base64 string', () => {
    expect(generateToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('produces at least 43 characters (32 bytes base64url)', () => {
    expect(generateToken().length).toBeGreaterThanOrEqual(43);
  });

  it('generates unique tokens', () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe('hashToken', () => {
  it('is deterministic', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
  });

  it('differs for different inputs', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
  });
});

describe('isExpired', () => {
  it('returns true for past timestamps', () => {
    expect(isExpired(new Date(Date.now() - 1000).toISOString())).toBe(true);
  });

  it('returns false for future timestamps', () => {
    expect(isExpired(new Date(Date.now() + 60_000).toISOString())).toBe(false);
  });
});

describe('addMinutes', () => {
  it('returns correct ISO string', () => {
    const base = new Date('2026-01-01T00:00:00.000Z');
    expect(addMinutes(base, 30)).toBe('2026-01-01T00:30:00.000Z');
  });
});

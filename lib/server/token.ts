import { createHash, randomBytes } from 'node:crypto';

export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date();
}

export function addMinutes(from: Date, minutes: number): string {
  return new Date(from.getTime() + minutes * 60_000).toISOString();
}

// Cron endpoint contract — auth + flush wiring.
//
// Auth: `Authorization: Bearer ${CRON_SECRET}` with timing-safe comparison.
// We exercise:
//   - missing header → 401
//   - wrong secret (different length) → 401, no flush() call
//   - wrong secret (same length) → 401, no flush() call
//   - missing CRON_SECRET env → 401 (fail closed)
//   - correct secret → 200 with `{ ok, failed, processed }`
//
// `getOutboxRepo` and `getResendSender` are mocked so we can assert the
// route delegates correctly without spinning a DB.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const flushMock = vi.fn();

vi.mock('@/lib/server/repositories/factory', () => ({
  getOutboxRepo: async () => ({ flush: flushMock }),
}));

vi.mock('@/lib/integrations/resend', () => ({
  getResendSender: () => async () => ({ ok: true }),
}));

const ORIGINAL_SECRET = process.env.CRON_SECRET;

beforeEach(() => {
  flushMock.mockReset();
  process.env.CRON_SECRET = 'super-secret-token';
});

afterEach(() => {
  if (ORIGINAL_SECRET) process.env.CRON_SECRET = ORIGINAL_SECRET;
  else delete process.env.CRON_SECRET;
});

async function callRoute(headers: HeadersInit) {
  const { POST } = await import('../route');
  const req = new Request('http://localhost/api/cron/flush-outbox', {
    method: 'POST',
    headers,
  });
  return POST(req);
}

describe('POST /api/cron/flush-outbox', () => {
  it('401 when Authorization header is missing', async () => {
    const res = await callRoute({});
    expect(res.status).toBe(401);
    expect(flushMock).not.toHaveBeenCalled();
  });

  it('401 on wrong secret with different length', async () => {
    const res = await callRoute({ authorization: 'Bearer nope' });
    expect(res.status).toBe(401);
    expect(flushMock).not.toHaveBeenCalled();
  });

  it('401 on wrong secret with same length (timing-safe path exercised)', async () => {
    const sameLenWrong = 'x'.repeat('super-secret-token'.length);
    const res = await callRoute({ authorization: `Bearer ${sameLenWrong}` });
    expect(res.status).toBe(401);
    expect(flushMock).not.toHaveBeenCalled();
  });

  it('401 when CRON_SECRET env is unset (fail closed)', async () => {
    delete process.env.CRON_SECRET;
    const res = await callRoute({ authorization: 'Bearer anything' });
    expect(res.status).toBe(401);
    expect(flushMock).not.toHaveBeenCalled();
  });

  it('200 + { ok, failed, processed } on correct secret', async () => {
    flushMock.mockResolvedValue({ ok: 3, failed: 1 });
    const res = await callRoute({
      authorization: 'Bearer super-secret-token',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: 3, failed: 1, processed: 4 });
    expect(flushMock).toHaveBeenCalledTimes(1);
    expect(flushMock).toHaveBeenCalledWith(expect.any(Function), 50);
  });
});

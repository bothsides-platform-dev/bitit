// flushAfterCommit smoke. The function is fire-and-forget so we test:
//   - calling it doesn't throw or block (returns synchronously, void)
//   - the outbox.flush() call lands on the next microtask
//   - errors thrown inside flush are caught (logged, not propagated)
//
// The factory (`getOutboxRepo`) is stubbed via `vi.mock` so the test stays
// decoupled from the real Drizzle/pglite stack.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const flushMock = vi.fn();

vi.mock('@/lib/server/repositories/factory', () => ({
  getOutboxRepo: async () => ({
    flush: flushMock,
  }),
}));

vi.mock('@/lib/integrations/resend', () => ({
  getResendSender: () => async () => ({ ok: true }),
}));

beforeEach(() => {
  flushMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('flushAfterCommit', () => {
  it('schedules outbox.flush on the next microtask and resolves with sender', async () => {
    flushMock.mockResolvedValue({ ok: 2, failed: 0 });
    const { flushAfterCommit } = await import('../post-commit');

    flushAfterCommit();
    // Not yet — Promise.resolve().then() runs after the current task.
    expect(flushMock).not.toHaveBeenCalled();

    // Drain the microtask queue.
    await new Promise((r) => setImmediate(r));
    expect(flushMock).toHaveBeenCalledTimes(1);
    expect(flushMock).toHaveBeenCalledWith(expect.any(Function), 50);
  });

  it('swallows flush errors (logs only, does not propagate)', async () => {
    flushMock.mockRejectedValue(new Error('db down'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { flushAfterCommit } = await import('../post-commit');

    expect(() => flushAfterCommit()).not.toThrow();
    await new Promise((r) => setImmediate(r));
    expect(errSpy).toHaveBeenCalled();
    const [label, err] = errSpy.mock.calls[0];
    expect(label).toContain('post-commit flush failed');
    expect((err as Error).message).toBe('db down');
  });
});

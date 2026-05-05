import { describe, expect, it, beforeEach, vi } from 'vitest';
import { NotificationOutboxAdapter } from '../outbox/adapter';

describe('NotificationOutboxAdapter', () => {
  let adapter: NotificationOutboxAdapter;

  beforeEach(() => {
    adapter = new NotificationOutboxAdapter(async () => ({ ok: true }));
  });

  it('enqueues a notification', () => {
    adapter.enqueue({ event: 'auth.verify', to: 'u@e.com', subject: 'S', html: '' });
    expect(adapter.getPending()).toHaveLength(1);
  });

  it('suppresses duplicate by dedupeKey', () => {
    const key = 'invite-rfq1-pg1';
    adapter.enqueue({ event: 'rfq.invited', to: 'a@b.com', subject: 'X', html: '', dedupeKey: key });
    const second = adapter.enqueue({ event: 'rfq.invited', to: 'a@b.com', subject: 'X', html: '', dedupeKey: key });
    expect(second).toBeNull();
    expect(adapter.getPending()).toHaveLength(1);
  });

  it('flushes and marks sent on success', async () => {
    adapter.enqueue({ event: 'auth.verify', to: 'u@e.com', subject: 'S', html: '' });
    const { sent, failed } = await adapter.flush();
    expect(sent).toBe(1);
    expect(failed).toBe(0);
    expect(adapter.getPending()).toHaveLength(0);
  });

  it('stays pending under maxAttempts on failure', async () => {
    const failSender = vi.fn().mockResolvedValue({ ok: false, error: 'SMTP err' });
    adapter = new NotificationOutboxAdapter(failSender);
    adapter.enqueue({ event: 'auth.verify', to: 'u@e.com', subject: 'S', html: '', maxAttempts: 3 });

    await adapter.flush(); // attempt 1
    expect(adapter.getPending()).toHaveLength(1);
    expect(adapter.getAll()[0].attempts).toBe(1);
  });

  it('marks failed after exhausting maxAttempts', async () => {
    const failSender = vi.fn().mockResolvedValue({ ok: false, error: 'err' });
    adapter = new NotificationOutboxAdapter(failSender);
    adapter.enqueue({ event: 'auth.reset', to: 'u@e.com', subject: 'S', html: '', maxAttempts: 2 });

    await adapter.flush();
    await adapter.flush();
    expect(adapter.getAll()[0].status).toBe('failed');
    expect(adapter.getPending()).toHaveLength(0);
  });

  it('does not resend already-sent entries', async () => {
    const sender = vi.fn().mockResolvedValue({ ok: true });
    adapter = new NotificationOutboxAdapter(sender);
    adapter.enqueue({ event: 'auth.verify', to: 'u@e.com', subject: 'S', html: '' });

    await adapter.flush();
    await adapter.flush();
    expect(sender).toHaveBeenCalledTimes(1);
  });

  it('allows multiple entries with no dedupeKey', () => {
    adapter.enqueue({ event: 'auth.verify', to: 'a@e.com', subject: 'S', html: '' });
    adapter.enqueue({ event: 'auth.verify', to: 'b@e.com', subject: 'S', html: '' });
    expect(adapter.getPending()).toHaveLength(2);
  });
});

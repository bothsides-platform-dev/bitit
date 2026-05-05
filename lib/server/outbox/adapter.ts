import { randomUUID } from 'node:crypto';
import type { OutboxEntry, OutboxEvent, Sender } from './types';

export class NotificationOutboxAdapter {
  private store = new Map<string, OutboxEntry>();
  private dedupeIndex = new Set<string>();

  constructor(private sender: Sender = async () => ({ ok: true })) {}

  enqueue(params: {
    event: OutboxEvent;
    to: string;
    subject: string;
    html: string;
    dedupeKey?: string;
    maxAttempts?: number;
  }): OutboxEntry | null {
    if (params.dedupeKey && this.dedupeIndex.has(params.dedupeKey)) {
      return null;
    }

    const entry: OutboxEntry = {
      id: randomUUID(),
      event: params.event,
      to: params.to,
      subject: params.subject,
      html: params.html,
      dedupeKey: params.dedupeKey,
      status: 'pending',
      attempts: 0,
      maxAttempts: params.maxAttempts ?? 3,
      scheduledAt: new Date().toISOString(),
    };

    this.store.set(entry.id, entry);
    if (params.dedupeKey) this.dedupeIndex.add(params.dedupeKey);
    return { ...entry };
  }

  async flush(): Promise<{ sent: number; failed: number }> {
    const pending = [...this.store.values()].filter(e => e.status === 'pending');
    let sent = 0;
    let failed = 0;

    for (const entry of pending) {
      const updated = { ...entry, attempts: entry.attempts + 1 };
      const result = await this.sender(updated);

      if (result.ok) {
        updated.status = 'sent';
        updated.sentAt = new Date().toISOString();
        sent++;
      } else {
        updated.lastError = result.error;
        if (updated.attempts >= updated.maxAttempts) {
          updated.status = 'failed';
          failed++;
        }
      }

      this.store.set(updated.id, updated);
    }

    return { sent, failed };
  }

  getPending(): OutboxEntry[] {
    return [...this.store.values()].filter(e => e.status === 'pending').map(e => ({ ...e }));
  }

  getAll(): OutboxEntry[] {
    return [...this.store.values()].map(e => ({ ...e }));
  }

  clear(): void {
    this.store.clear();
    this.dedupeIndex.clear();
  }
}

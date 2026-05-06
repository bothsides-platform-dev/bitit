'use client';

import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Tag } from '@/components/primitives/Tag';
import { useNotificationsStore } from '@/lib/stores/notifications';
import type { NotificationStatus } from '@/lib/types/notification';

const statusVariant: Record<NotificationStatus, 'amber' | 'moss' | 'terracotta' | 'muted'> = {
  pending: 'amber',
  sent: 'moss',
  failed: 'terracotta',
  read: 'muted',
};

const statusLabel: Record<NotificationStatus, string> = {
  pending: '대기',
  sent: '발송',
  failed: '실패',
  read: '읽음',
};

const channelLabel: Record<string, string> = {
  email: 'EMAIL',
  inapp: 'IN-APP',
};

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function NotificationsSettingsPage() {
  const notifications = useNotificationsStore((s) => s.notifications);
  const retry = useNotificationsStore((s) => s.retry);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  const counts = {
    total: notifications.length,
    pending: notifications.filter((n) => n.status === 'pending').length,
    sent: notifications.filter((n) => n.status === 'sent').length,
    failed: notifications.filter((n) => n.status === 'failed').length,
    read: notifications.filter((n) => n.status === 'read').length,
  };

  return (
    <div className="px-8 py-8 max-w-[860px] space-y-12">
      <div>
        <Eyebrow className="block mb-2">SETTINGS · NOTIFICATIONS</Eyebrow>
        <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          알림 활동
        </h1>
        <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
          이메일 + 인앱 발송 기록과 outbox 재시도를 관리합니다.
        </p>
      </div>

      {/* KPI strip */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Eyebrow>FIG. 01 — Outbox 상태</Eyebrow>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
          {counts.pending + counts.sent > 0 && (
            <button
              onClick={markAllRead}
              className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
            >
              모두 읽음
            </button>
          )}
        </div>
        <div className="grid grid-cols-5 gap-px bg-[var(--color-hair)] border border-[var(--color-hair)]">
          {[
            ['전체', counts.total, 'text-[var(--color-ink)]'],
            ['대기', counts.pending, 'text-[var(--color-amber)]'],
            ['발송', counts.sent, 'text-[var(--color-moss)]'],
            ['실패', counts.failed, 'text-[var(--color-terracotta)]'],
            ['읽음', counts.read, 'text-[var(--color-ink-soft)]'],
          ].map(([k, v, color]) => (
            <div key={k as string} className="bg-[var(--color-paper)] px-4 py-5">
              <p className={`font-mono text-[36px] tabular-nums leading-none font-[300] ${color}`}>
                {String(v).padStart(2, '0')}
              </p>
              <p className="mt-3 font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">
                {k}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Activity log */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Eyebrow>FIG. 02 — 발송 기록</Eyebrow>
          <span className="font-mono tabular-nums text-[11px] text-[var(--color-ink-soft)]">
            {String(notifications.length).padStart(3, '0')}건
          </span>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>

        {notifications.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[13px] text-[var(--color-ink-muted)]">
              아직 발송된 알림이 없습니다.
            </p>
            <p className="mt-2 font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-faint)]">
              — FIN —
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-hair)] border-y border-[var(--color-hair)]">
            {notifications.map((n, i) => (
              <div key={n.id} className="py-4 flex items-start gap-4">
                <span className="font-mono text-[10px] tabular-nums text-[var(--color-ink-faint)] w-8 mt-0.5">
                  {String(notifications.length - i).padStart(3, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
                      {channelLabel[n.channel] ?? n.channel}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--color-ink-faint)]">·</span>
                    <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
                      {n.type}
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--color-ink)] font-medium">{n.title}</p>
                  <p className="text-[12px] text-[var(--color-ink-muted)] mt-0.5">{n.body}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="font-mono text-[10px] tabular-nums text-[var(--color-ink-faint)]">
                      {fmtDateTime(n.createdAt)}
                    </span>
                    {n.linkUrl && (
                      <span className="font-mono text-[10px] text-[var(--color-ink-faint)]">
                        → {n.linkUrl}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Tag variant={statusVariant[n.status]}>{statusLabel[n.status]}</Tag>
                  {n.status === 'failed' && (
                    <button
                      type="button"
                      onClick={() => retry(n.id)}
                      className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-amber)] hover:text-[var(--color-ink)] transition-colors"
                    >
                      재시도 →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

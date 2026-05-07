'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Tag } from '@/components/primitives/Tag';
import { markNotificationReadAction } from '@/lib/server/actions/notifications/markNotificationReadAction';
import type { Notification, NotificationStatus } from '@/lib/types/notification';

const statusVariant: Record<NotificationStatus, 'amber' | 'moss' | 'terracotta' | 'muted'> = {
  pending: 'amber',
  sent: 'terracotta',
  failed: 'terracotta',
  read: 'muted',
};

const statusLabel: Record<NotificationStatus, string> = {
  pending: '대기',
  sent: '미읽음',
  failed: '실패',
  read: '읽음',
};

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function NotificationActivityList({ items }: { items: Notification[] }) {
  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[13px] text-[var(--color-ink-muted)]">
          아직 받은 알림이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--color-hair)] border-y border-[var(--color-hair)]">
      {items.map((n, i) => (
        <NotificationRow key={n.id} notif={n} indexFromEnd={items.length - i} />
      ))}
    </div>
  );
}

function NotificationRow({
  notif,
  indexFromEnd,
}: {
  notif: Notification;
  indexFromEnd: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const hasLink = Boolean(notif.linkUrl);
  const isUnread = notif.status !== 'read';

  const navigate = () => {
    if (notif.status !== 'read') {
      void markNotificationReadAction({ notificationId: notif.id });
    }
    if (notif.linkUrl) router.push(notif.linkUrl);
  };

  const markReadInPlace = () =>
    start(async () => {
      await markNotificationReadAction({ notificationId: notif.id });
      router.refresh();
    });

  const body = (
    <>
      <span className="font-mono text-[10px] tabular-nums text-[var(--color-ink-faint)] w-8 mt-0.5 shrink-0">
        {String(indexFromEnd).padStart(3, '0')}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
            {notif.type}
          </span>
        </div>
        <p className={`text-[13px] font-medium ${isUnread ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'}`}>
          {notif.title}
        </p>
        <p className="text-[12px] text-[var(--color-ink-muted)] mt-0.5">
          {notif.body}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span className="font-mono text-[10px] tabular-nums text-[var(--color-ink-faint)]">
            {fmtDateTime(notif.createdAt)}
          </span>
          {notif.linkUrl && (
            <span className="font-mono text-[10px] text-[var(--color-ink-faint)]">
              → {notif.linkUrl}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <Tag variant={statusVariant[notif.status]}>{statusLabel[notif.status]}</Tag>
        {!hasLink && isUnread && (
          <button
            type="button"
            disabled={pending}
            onClick={(e) => {
              e.stopPropagation();
              markReadInPlace();
            }}
            className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors disabled:opacity-50"
          >
            {pending ? '처리 중…' : '읽음 처리'}
          </button>
        )}
      </div>
    </>
  );

  if (hasLink) {
    return (
      <button
        type="button"
        onClick={navigate}
        className="w-full text-left py-4 px-2 -mx-2 flex items-start gap-4 hover:bg-[var(--color-paper-warm)] transition-colors"
      >
        {body}
      </button>
    );
  }

  return (
    <div className="py-4 px-2 -mx-2 flex items-start gap-4 opacity-80">
      {body}
    </div>
  );
}

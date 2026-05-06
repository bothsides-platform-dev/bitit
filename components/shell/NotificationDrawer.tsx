'use client';

import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/stores/ui';
import { useNotificationsStore } from '@/lib/stores/notifications';
import { XIcon, EnvelopeIcon } from '@/components/icons';
import { IconButton } from '@/components/primitives/IconButton';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Tag } from '@/components/primitives/Tag';
import type { Notification, NotificationStatus } from '@/lib/types/notification';

const statusVariant: Record<NotificationStatus, 'amber' | 'moss' | 'terracotta' | 'muted'> = {
  pending: 'amber',
  sent: 'moss',
  failed: 'terracotta',
  read: 'muted',
};

const statusLabel: Record<NotificationStatus, string> = {
  pending: '신규',
  sent: '발송됨',
  failed: '실패',
  read: '읽음',
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export function NotificationDrawer() {
  const router = useRouter();
  const { notificationDrawerOpen, closeNotificationDrawer } = useUIStore();
  const notifications = useNotificationsStore((s) => s.notifications);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  const unreadCount = notifications.filter(
    (n) => n.status === 'pending' || n.status === 'sent',
  ).length;

  const handleClick = (notif: Notification) => {
    markRead(notif.id);
    closeNotificationDrawer();
    if (notif.linkUrl) router.push(notif.linkUrl);
  };

  return (
    <>
      {notificationDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(10,10,15,0.4)] backdrop-blur-[4px]"
          onClick={closeNotificationDrawer}
          aria-hidden
        />
      )}

      <aside
        role="complementary"
        aria-label="알림"
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-[var(--color-paper)] border-l border-[var(--color-hair)] transition-transform duration-[420ms]"
        style={{
          width: 420,
          transform: notificationDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="flex items-center justify-between px-6 h-[var(--shell-topbar)] border-b border-[var(--color-hair)]">
          <div className="flex items-center gap-3">
            <Eyebrow>알림</Eyebrow>
            {unreadCount > 0 && (
              <span className="font-mono text-[10px] tabular-nums text-[var(--color-amber)]">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
              >
                모두 읽음
              </button>
            )}
            <IconButton label="닫기" onClick={closeNotificationDrawer}>
              <XIcon size={18} />
            </IconButton>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 px-8 text-center">
              <EnvelopeIcon size={32} className="text-[var(--color-ink-faint)]" />
              <p className="text-[13px] text-[var(--color-ink-muted)]">
                새로운 알림이 없습니다.
              </p>
              <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-faint)]">
                — FIN —
              </span>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = notif.status === 'pending' || notif.status === 'sent';
              return (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left relative px-6 py-4 border-b border-[var(--color-hair)] hover:bg-[var(--color-paper-warm)] transition-colors ${
                    isUnread ? 'bg-[var(--color-paper)]' : 'opacity-60'
                  }`}
                >
                  {isUnread && (
                    <span className="absolute left-2 top-5 w-1 h-1 rounded-full bg-[var(--color-amber)]" />
                  )}
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-[13px] text-[var(--color-ink)] font-medium leading-snug">
                      {notif.title}
                    </p>
                    <Tag variant={statusVariant[notif.status]} className="shrink-0">
                      {statusLabel[notif.status]}
                    </Tag>
                  </div>
                  <p className="text-[12px] text-[var(--color-ink-muted)] mt-0.5 leading-relaxed">
                    {notif.body}
                  </p>
                  <span className="font-mono text-[10px] text-[var(--color-ink-soft)] mt-2 block tabular-nums">
                    {timeAgo(notif.createdAt)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}

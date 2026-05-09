'use client';

import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/stores/ui';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { XIcon, EnvelopeIcon } from '@/components/icons';
import { IconButton } from '@/components/primitives/IconButton';
import { Label } from '@/components/primitives/Label';
import { Chip, type ChipColor } from '@/components/primitives/Chip';
import type { Notification, NotificationStatus } from '@/lib/types/notification';

const statusColor: Record<NotificationStatus, ChipColor> = {
  pending: 'warning',
  sent: 'tertiary',
  failed: 'error',
  read: 'surface',
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
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const handleClick = (notif: Notification) => {
    void markRead(notif.id);
    closeNotificationDrawer();
    if (notif.linkUrl) router.push(notif.linkUrl);
  };

  return (
    <>
      {notificationDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--md-sys-color-scrim)]/40 backdrop-blur-[4px]"
          onClick={closeNotificationDrawer}
          aria-hidden
        />
      )}

      <aside
        role="complementary"
        aria-label="알림"
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-[var(--md-sys-color-surface)] border-l border-[var(--md-sys-color-outline-variant)] transition-transform duration-[var(--md-sys-motion-duration-medium-4)]"
        style={{
          width: 420,
          transform: notificationDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transitionTimingFunction: 'var(--md-sys-motion-easing-emphasized-decelerate)',
        }}
      >
        <div className="flex items-center justify-between px-6 h-[var(--shell-topbar)] border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center gap-3">
            <Label size="md" muted={false}>알림</Label>
            {unreadCount > 0 && (
              <span className="md-numeric text-[length:var(--md-typescale-label-small-size)] text-[var(--md-sys-color-warning)]">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="text-[length:var(--md-typescale-label-medium-size)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
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
              <EnvelopeIcon size={32} className="text-[var(--md-sys-color-outline)]" />
              <p className="text-[length:var(--md-typescale-body-medium-size)] text-[var(--md-sys-color-on-surface-variant)]">
                새로운 알림이 없습니다.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = notif.status === 'pending' || notif.status === 'sent';
              return (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left relative px-6 py-4 border-b border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors ${
                    isUnread ? 'bg-[var(--md-sys-color-surface)]' : 'opacity-60'
                  }`}
                >
                  {isUnread && (
                    <span className="absolute left-2 top-5 w-1 h-1 rounded-full bg-[var(--md-sys-color-warning)]" />
                  )}
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-[length:var(--md-typescale-body-medium-size)] font-[number:500] text-[var(--md-sys-color-on-surface)] leading-snug">
                      {notif.title}
                    </p>
                    <Chip
                      label={statusLabel[notif.status]}
                      color={statusColor[notif.status]}
                      className="shrink-0"
                    />
                  </div>
                  <p className="text-[length:var(--md-typescale-body-small-size)] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 leading-relaxed">
                    {notif.body}
                  </p>
                  <span className="md-numeric text-[length:var(--md-typescale-label-small-size)] text-[var(--md-sys-color-on-surface-variant)] mt-2 block">
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

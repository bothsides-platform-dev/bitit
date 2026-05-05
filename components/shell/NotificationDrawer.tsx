'use client';

import { useUIStore } from '@/lib/stores/ui';
import { MOCK_NOTIFICATIONS } from '@/lib/mock/notifications';
import { XIcon, EnvelopeIcon } from '@/components/icons';
import { IconButton } from '@/components/primitives/IconButton';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { formatDate } from '@/lib/format';

export function NotificationDrawer() {
  const { notificationDrawerOpen, closeNotificationDrawer } = useUIStore();

  return (
    <>
      {/* Overlay */}
      {notificationDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(10,10,15,0.4)] backdrop-blur-[4px]"
          onClick={closeNotificationDrawer}
          aria-hidden
        />
      )}

      {/* Drawer */}
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-[var(--shell-topbar)] border-b border-[var(--color-hair)]">
          <Eyebrow>알림</Eyebrow>
          <IconButton label="닫기" onClick={closeNotificationDrawer}>
            <XIcon size={18} />
          </IconButton>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {MOCK_NOTIFICATIONS.length === 0 ? (
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
            MOCK_NOTIFICATIONS.map((notif) => (
              <div
                key={notif.id}
                className="px-6 py-4 border-b border-[var(--color-hair)] hover:bg-[var(--color-paper-warm)] transition-colors cursor-pointer"
              >
                <p className="text-[13px] text-[var(--color-ink)] font-medium">{notif.title}</p>
                <p className="text-[12px] text-[var(--color-ink-muted)] mt-0.5">{notif.body}</p>
                <span className="font-mono text-[10px] text-[var(--color-ink-soft)] mt-1 block tabular-nums">
                  {formatDate(notif.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

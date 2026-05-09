// Notifications settings page — RSC.
//
// 사용자용 인앱 알림 아카이브. row 클릭 시 markRead + linkUrl 네비게이션.
// 이메일 outbox 운영 지표(KPI strip / 재시도 버튼)는 사용자 화면에 노출하지 않는다 —
// `channel: 'inapp'`만 SQL 단에서 필터하여 fetch.
import { requireSession } from '@/lib/auth/session';
import { getNotificationRepo } from '@/lib/server/repositories/factory';
import { Label } from '@/components/primitives/Label';
import { PageEnter } from '@/components/primitives/PageEnter';
import type { Notification } from '@/lib/types/notification';

import { MarkAllReadButton } from './MarkAllReadButton';
import { NotificationActivityList } from './NotificationActivityList';

export const dynamic = 'force-dynamic';

export default async function NotificationsSettingsPage() {
  const session = await requireSession();
  const repo = await getNotificationRepo();
  const notifications: Notification[] = await repo.findRecentForUser(
    session.user.id,
    100,
    'inapp',
  );
  const unreadCount = notifications.filter((n) => n.status !== 'read').length;

  return (
    <PageEnter className="px-4 py-6 md:px-8 md:py-8 space-y-8">
      <div>
        <Label size="md" muted={false} as="span" className="block mb-2">SETTINGS · NOTIFICATIONS</Label>
        <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          알림 활동
        </h1>
        <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
          받은 알림 기록입니다. 항목을 클릭하면 해당 공고로 이동합니다.
        </p>
      </div>

      <section>
        <div className="flex items-center gap-3 mb-4">
          <Label size="md" muted={false}>받은 알림</Label>
          <span className="font-mono tabular-nums text-[11px] text-[var(--color-ink-soft)]">
            {String(notifications.length).padStart(3, '0')}건
            {unreadCount > 0 && (
              <>
                <span className="mx-2 text-[var(--color-ink-faint)]">·</span>
                <span className="text-[var(--color-terracotta)]">
                  미읽음 {String(unreadCount).padStart(3, '0')}
                </span>
              </>
            )}
          </span>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
          {unreadCount > 0 && <MarkAllReadButton />}
        </div>

        <NotificationActivityList items={notifications} />
      </section>
    </PageEnter>
  );
}

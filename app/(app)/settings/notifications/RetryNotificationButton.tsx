'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { retryEmailNotificationAction } from '@/lib/server/actions/notifications/retryEmailNotificationAction';

export function RetryNotificationButton({
  notificationId,
}: {
  notificationId: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await retryEmailNotificationAction({ notificationId });
          router.refresh();
        })
      }
      className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-amber)] hover:text-[var(--color-ink)] transition-colors disabled:opacity-50"
    >
      {pending ? '재시도…' : '재시도 →'}
    </button>
  );
}

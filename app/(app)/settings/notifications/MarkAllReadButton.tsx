'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { markAllReadAction } from '@/lib/server/actions/notifications/markAllReadAction';

export function MarkAllReadButton() {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markAllReadAction();
          router.refresh();
        })
      }
      className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors disabled:opacity-50"
    >
      {pending ? '처리 중…' : '모두 읽음'}
    </button>
  );
}

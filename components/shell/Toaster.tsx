'use client';

import { Toast, useToastManager } from '@base-ui/react/toast';
import { toastManager } from '@/lib/toast';

function ToastViewport() {
  const { toasts } = useToastManager();

  return (
    <Toast.Viewport className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 outline-none">
      {toasts.map((t) => (
        <Toast.Root
          key={t.id}
          toast={t}
          className="flex items-start justify-between gap-6 rounded-[var(--r)] border border-[var(--color-hair)] bg-[var(--color-ink)] px-4 py-3 shadow-sm transition-all duration-200 data-[starting-style]:translate-y-1 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-1 data-[ending-style]:opacity-0"
        >
          <Toast.Title className="font-mono text-[11px] tracking-[0.04em] text-[var(--color-paper)]">
            {t.title}
          </Toast.Title>
          <Toast.Close
            aria-label="닫기"
            className="font-mono text-[10px] tracking-[0.1em] text-[var(--color-paper)] opacity-50 hover:opacity-100 transition-opacity shrink-0"
          >
            ×
          </Toast.Close>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  );
}

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider toastManager={toastManager}>
      {children}
      <ToastViewport />
    </Toast.Provider>
  );
}

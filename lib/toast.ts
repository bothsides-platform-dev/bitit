import { Toast } from '@base-ui/react';

const { createToastManager } = Toast;

export const toastManager = createToastManager();

export function toast(message: string, opts?: { type?: 'info' | 'error'; timeout?: number }) {
  return toastManager.add({ title: message, type: opts?.type ?? 'info', timeout: opts?.timeout ?? 5000 });
}

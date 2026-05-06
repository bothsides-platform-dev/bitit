'use client';

import { create } from 'zustand';
import type { Notification, NotificationStatus } from '@/lib/types/notification';
import { MOCK_NOTIFICATIONS } from '@/lib/mock/notifications';

type NewNotification = Omit<Notification, 'id' | 'createdAt' | 'status' | 'channel'> & {
  channel?: Notification['channel'];
  status?: NotificationStatus;
};

type NotificationsStore = {
  notifications: Notification[];
  add: (input: NewNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  retry: (id: string) => void;
};

function nextId(): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `notif-runtime-${uuid}`;
}

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: [...MOCK_NOTIFICATIONS],
  add: (input) =>
    set((s) => ({
      notifications: [
        {
          id: nextId(),
          channel: input.channel ?? 'inapp',
          status: input.status ?? 'pending',
          createdAt: new Date().toISOString(),
          ...input,
        },
        ...s.notifications,
      ],
    })),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, status: 'read', readAt: new Date().toISOString() } : n,
      ),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.status === 'pending' || n.status === 'sent'
          ? { ...n, status: 'read', readAt: new Date().toISOString() }
          : n,
      ),
    })),
  retry: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, status: 'sent', sentAt: new Date().toISOString() } : n,
      ),
    })),
}));

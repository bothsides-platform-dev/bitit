'use client';

import { create } from 'zustand';

type UIStore = {
  notificationDrawerOpen: boolean;
  commandPaletteOpen: boolean;
  toggleNotificationDrawer: () => void;
  openNotificationDrawer: () => void;
  closeNotificationDrawer: () => void;
  toggleCommandPalette: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
};

export const useUIStore = create<UIStore>((set) => ({
  notificationDrawerOpen: false,
  commandPaletteOpen: false,
  toggleNotificationDrawer: () =>
    set((s) => ({ notificationDrawerOpen: !s.notificationDrawerOpen })),
  openNotificationDrawer: () => set({ notificationDrawerOpen: true }),
  closeNotificationDrawer: () => set({ notificationDrawerOpen: false }),
  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
}));

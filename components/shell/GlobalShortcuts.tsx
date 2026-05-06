'use client';

import { useRouter } from 'next/navigation';
import { useShortcut } from '@/lib/hooks/useShortcut';
import { useUIStore } from '@/lib/stores/ui';

export function GlobalShortcuts() {
  const router = useRouter();
  const closeDrawer = useUIStore((s) => s.closeNotificationDrawer);
  const closePalette = useUIStore((s) => s.closeCommandPalette);
  const drawerOpen = useUIStore((s) => s.notificationDrawerOpen);
  const paletteOpen = useUIStore((s) => s.commandPaletteOpen);

  useShortcut('n', (e) => {
    e.preventDefault();
    router.push('/rfq/new');
  }, { meta: true });

  useShortcut('Escape', () => {
    if (paletteOpen) closePalette();
    else if (drawerOpen) closeDrawer();
  }, { preventInInput: false });

  return null;
}

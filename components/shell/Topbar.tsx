'use client';

import { useUIStore } from '@/lib/stores/ui';
import { IconButton } from '@/components/primitives/IconButton';
import { BellIcon, SearchIcon } from '@/components/icons';
import { Avatar } from '@/components/primitives/Avatar';
import { MOCK_SESSION_BUYER } from '@/lib/mock/workspaces';
import { MOCK_NOTIFICATIONS } from '@/lib/mock/notifications';

export function Topbar() {
  const { openNotificationDrawer, openCommandPalette } = useUIStore();
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.status === 'pending').length;

  return (
    <header
      style={{ gridArea: 'topbar' }}
      className="flex items-center justify-between px-6 border-b border-[var(--color-hair)] bg-[var(--color-paper)]"
    >
      {/* Search shortcut */}
      <button
        type="button"
        onClick={openCommandPalette}
        className="flex items-center gap-2 h-8 px-3 rounded-[var(--r-sm)] border border-[var(--color-hair)] text-[var(--color-ink-soft)] hover:border-[var(--color-hair-strong)] hover:text-[var(--color-ink)] transition-colors duration-[140ms]"
        aria-label="검색 (⌘K)"
      >
        <SearchIcon size={14} />
        <span className="font-mono text-[11px] tracking-[0.1em]">검색</span>
        <kbd className="ml-2 font-mono text-[9px] tracking-[0.1em] opacity-50">⌘K</kbd>
      </button>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative">
          <IconButton label="알림" onClick={openNotificationDrawer}>
            <BellIcon size={18} />
          </IconButton>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--color-amber)]" />
          )}
        </div>

        {/* User avatar */}
        <Avatar
          name={MOCK_SESSION_BUYER.name}
          color="accent"
          size="sm"
          className="cursor-pointer"
        />
      </div>
    </header>
  );
}

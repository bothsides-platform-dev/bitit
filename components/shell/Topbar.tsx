'use client';

import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/stores/ui';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { IconButton } from '@/components/primitives/IconButton';
import { BellIcon, SearchIcon } from '@/components/icons';
import { Avatar } from '@/components/primitives/Avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export type TopbarProps = {
  user: { id: string; email: string; name: string };
  workspaceType: 'buyer' | 'pg';
  workspaceName: string;
};

export function Topbar({ user, workspaceType }: TopbarProps) {
  const { openNotificationDrawer, openCommandPalette } = useUIStore();
  // Step 9: unread 배지 = SSE 라이브 카운트.
  const { unreadCount } = useNotifications();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <header
      style={{ gridArea: 'topbar' }}
      className="fixed top-0 left-[var(--shell-sidebar)] right-0 z-20 h-[var(--shell-topbar)] flex items-center justify-between px-6 border-b border-[var(--color-hair)] bg-[var(--color-paper)]"
    >
      {/* Search shortcut */}
      <button
        type="button"
        onClick={openCommandPalette}
        className="flex items-center gap-2 h-8 w-72 px-3 rounded-[var(--r-sm)] border border-[var(--color-hair)] text-[var(--color-ink-soft)] hover:border-[var(--color-hair-strong)] hover:text-[var(--color-ink)] transition-colors duration-[140ms]"
        aria-label="검색 (⌘K)"
      >
        <SearchIcon size={14} />
        <span className="font-mono text-[11px] tracking-[0.1em]">검색</span>
        <kbd className="ml-auto font-mono text-[9px] tracking-[0.1em] opacity-50">⌘K</kbd>
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

        {/* User avatar + profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none rounded-[var(--r-sm)]">
            <Avatar name={user.name} color="ink" size="sm" className="cursor-pointer" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="end"
            sideOffset={8}
            className="min-w-[180px] rounded-[var(--r)] border border-[var(--color-hair)] bg-[var(--color-paper)] p-1 shadow-sm"
          >
            <div className="px-2 py-1.5">
              <p className="font-mono text-[11px] font-medium tracking-[0.04em] text-[var(--color-ink)]">
                {user.name}
              </p>
              <p className="font-mono text-[10px] text-[var(--color-ink-soft)] mt-0.5">
                {user.email}
              </p>
              <p className="font-mono text-[10px] text-[var(--color-ink-soft)] mt-1">
                [ {workspaceType === 'buyer' ? '구매사' : 'PG'} ]
              </p>
            </div>
            <DropdownMenuSeparator className="bg-[var(--color-hair)]" />
            <DropdownMenuItem
              onClick={() => router.push('/settings/profile')}
              className="font-mono text-[11px] tracking-[0.04em] text-[var(--color-ink)] cursor-pointer px-2 py-1.5 rounded-[var(--r-sm)] hover:bg-[var(--color-field)]"
            >
              설정
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="font-mono text-[11px] tracking-[0.04em] text-[var(--color-ink)] cursor-pointer px-2 py-1.5 rounded-[var(--r-sm)] hover:bg-[var(--color-field)]"
            >
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

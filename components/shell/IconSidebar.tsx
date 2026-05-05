'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { HomeIcon, FileTextIcon, InboxIcon, SettingsIcon } from '@/components/icons';

type NavItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
};

const navItems: NavItem[] = [
  { href: '/home', icon: <HomeIcon />, label: 'Home' },
  { href: '/rfq', icon: <FileTextIcon />, label: 'RFQ' },
  { href: '/inbox', icon: <InboxIcon />, label: 'Inbox' },
  { href: '/settings/profile', icon: <SettingsIcon />, label: 'Settings' },
];

export function IconSidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ gridArea: 'sidebar' }}
      className="flex flex-col items-center py-4 bg-[var(--color-night)] border-r border-[var(--color-night-2)] row-span-2"
    >
      {/* Wordmark */}
      <div className="mb-8 font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--color-paper)] opacity-80 writing-mode-vertical px-1 text-center leading-tight">
        B
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                'relative flex items-center justify-center w-10 h-10 rounded-[var(--r)] transition-colors duration-[140ms]',
                active
                  ? 'text-[var(--color-paper)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-5 before:bg-[var(--color-amber)] before:rounded-r'
                  : 'text-[var(--color-paper)] opacity-40 hover:opacity-80',
              )}
            >
              {item.icon}
            </Link>
          );
        })}
      </nav>

      {/* Bottom version mark */}
      <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-[var(--color-paper)] opacity-20 mb-1 [writing-mode:vertical-lr] rotate-180">
        v0 · 2026
      </span>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Eyebrow } from '@/components/primitives/Eyebrow';

type SubnavItem = { href: string; label: string };

type SubnavProps = {
  title: string;
  items: SubnavItem[];
  action?: React.ReactNode;
};

export function Subnav({ title, items, action }: SubnavProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col shrink-0 border-r border-[var(--color-hair)] bg-[var(--color-paper)] overflow-y-auto"
      style={{ width: 'var(--shell-subnav)' }}
    >
      <div className="px-5 py-4 border-b border-[var(--color-hair)] flex items-center justify-between">
        <Eyebrow>{title}</Eyebrow>
        {action}
      </div>
      <nav className="flex flex-col py-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-5 py-2.5 text-[13px] transition-colors duration-[140ms]',
                active
                  ? 'text-[var(--color-ink)] bg-[var(--color-paper-warm)] font-medium'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)]',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

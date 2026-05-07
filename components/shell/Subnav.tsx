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
      className="flex shrink-0 bg-[var(--color-paper)] flex-row md:flex-col w-full md:w-[var(--shell-subnav)] border-b md:border-b-0 md:border-r border-[var(--color-hair)] overflow-x-auto md:overflow-y-auto"
    >
      <div className="hidden md:flex px-5 py-4 border-b border-[var(--color-hair)] items-center justify-between">
        <Eyebrow>{title}</Eyebrow>
        {action}
      </div>
      <nav className="flex flex-row md:flex-col md:py-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative whitespace-nowrap transition-colors duration-[140ms] px-4 md:px-5 h-11 md:h-auto md:py-2.5 flex items-center font-mono text-[11px] tracking-[0.14em] uppercase md:font-sans md:text-[13px] md:tracking-normal md:normal-case',
                active
                  ? 'text-[var(--color-ink)] md:bg-[var(--color-paper-warm)] md:font-medium after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-[var(--color-ink)] md:after:hidden md:border-l-2 md:border-[var(--color-amber)] md:pl-[calc(1.25rem-2px)]'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] md:hover:bg-[var(--color-paper-warm)]',
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

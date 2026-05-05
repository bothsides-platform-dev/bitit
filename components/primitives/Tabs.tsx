'use client';

import { cn } from '@/lib/utils';

type Tab = { id: string; label: string; count?: number };

type TabsProps = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
};

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex border-b border-[var(--color-hair)]',
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={tab.id === active}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative px-4 h-11 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors cursor-pointer',
            tab.id === active
              ? 'text-[var(--color-ink)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-[var(--color-ink)]'
              : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 tabular-nums">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

'use client';
import { cn } from '@/lib/utils';

type Tab = { id: string; label: string; count?: number };
type TabsProps = { tabs: Tab[]; active: string; onChange: (id: string) => void; className?: string };

const activeTabClass = [
  'text-[var(--md-sys-color-primary)]',
  'after:absolute after:bottom-0 after:left-0 after:right-0',
  'after:h-[3px] after:rounded-t-full after:bg-[var(--md-sys-color-primary)]',
].join(' ');

const inactiveTabClass = [
  'text-[var(--md-sys-color-on-surface-variant)]',
  'hover:text-[var(--md-sys-color-on-surface)]',
  'hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface)_8%,transparent)]',
].join(' ');

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div role="tablist" className={cn('flex border-b border-[var(--md-sys-color-outline-variant)]', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative px-4 h-12 transition-colors cursor-pointer',
              'text-[length:var(--md-typescale-title-small-size)]',
              'font-[number:var(--md-typescale-title-small-weight)]',
              'tracking-[var(--md-typescale-title-small-tracking)]',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--md-sys-color-primary)]/50',
              isActive ? activeTabClass : inactiveTabClass,
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 md-numeric">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

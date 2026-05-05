'use client';

import { cn } from '@/lib/utils';

type ChipProps = {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export function Chip({ children, active = false, onClick, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 h-7 font-mono text-[11px] tracking-[0.1em] uppercase border transition-colors',
        'rounded-[var(--r-xs)] cursor-pointer select-none',
        active
          ? 'border-[var(--color-ink)] text-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]'
          : 'border-[var(--color-hair-strong)] text-[var(--color-ink-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]',
        className,
      )}
    >
      {children}
    </button>
  );
}

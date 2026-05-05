import { cn } from '@/lib/utils';

type KpiCellProps = {
  label: string;
  serial?: string;
  value: string;
  delta?: { direction: 'up' | 'down' | 'flat'; text: string };
  className?: string;
};

const deltaIcon = { up: '↑', down: '↓', flat: '—' } as const;
const deltaColor = {
  up: 'text-[var(--color-moss)]',
  down: 'text-[var(--color-terracotta)]',
  flat: 'text-[var(--color-ink-soft)]',
} as const;

export function KpiCell({ label, serial, value, delta, className }: KpiCellProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">
          {label}
        </span>
        {serial && (
          <span className="font-mono text-[10px] tracking-[0.1em] text-[var(--color-ink-faint)]">
            {serial}
          </span>
        )}
      </div>
      <span
        className="font-mono tabular-nums text-[84px] leading-none font-light tracking-[-0.04em] text-[var(--color-ink)]"
        style={{ fontWeight: 300, fontSize: '84px' }}
      >
        {value}
      </span>
      {delta && (
        <span className={cn('font-mono text-[11px] tracking-[0.1em]', deltaColor[delta.direction])}>
          {deltaIcon[delta.direction]} {delta.text}
        </span>
      )}
    </div>
  );
}

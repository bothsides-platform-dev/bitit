import { cn } from '@/lib/utils';

type SerialProps = {
  current: number;
  total: number;
  label?: string;
  className?: string;
};

export function Serial({ current, total, label, className }: SerialProps) {
  const curr = String(current).padStart(2, '0');
  const tot = String(total).padStart(2, '0');
  return (
    <span
      className={cn(
        'font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--color-ink-soft)]',
        className,
      )}
    >
      {curr} / {tot}
      {label && <span className="ml-2">— {label}</span>}
    </span>
  );
}

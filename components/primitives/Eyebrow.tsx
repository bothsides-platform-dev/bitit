import { cn } from '@/lib/utils';

type EyebrowProps = {
  children: React.ReactNode;
  className?: string;
};

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        'font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]',
        className,
      )}
    >
      {children}
    </span>
  );
}

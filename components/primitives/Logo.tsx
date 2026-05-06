import Link from 'next/link';
import { cn } from '@/lib/utils';

type LogoVariant = 'default' | 'compact';

type LogoProps = {
  variant?: LogoVariant;
  className?: string;
};

export function Logo({ variant = 'default', className }: LogoProps) {
  if (variant === 'compact') {
    return (
      <Link
        href="/home"
        aria-label="bidit 홈"
        className={cn(
          'group flex items-center justify-center',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-paper)]',
          'rounded-[var(--r-xs)]',
          className,
        )}
      >
        <span
          className={cn(
            'inline-flex items-center justify-center w-[18px] h-[18px] border',
            'border-[color-mix(in_srgb,var(--color-paper)_40%,transparent)]',
            'group-hover:border-[color-mix(in_srgb,var(--color-paper)_80%,transparent)]',
            'transition duration-[140ms]',
          )}
        >
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase leading-none select-none text-[var(--color-paper)] opacity-80 group-hover:opacity-100 transition-opacity duration-[140ms]">
            B
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/home"
      aria-label="bidit 홈"
      className={cn(
        'group inline-flex items-center gap-3',
        'opacity-100 hover:opacity-60 transition-opacity duration-[140ms]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]',
        'rounded-[var(--r-xs)]',
        className,
      )}
    >
      <span className="inline-flex items-center justify-center shrink-0 w-[18px] h-[18px] border border-[color-mix(in_srgb,var(--color-ink)_40%,transparent)]">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase leading-none select-none text-[var(--color-ink)]">
          B
        </span>
      </span>
      <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--color-ink)]">
        BIDIT
      </span>
    </Link>
  );
}

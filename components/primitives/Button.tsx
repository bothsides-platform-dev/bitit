import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-ink-muted)] active:scale-[0.98]',
  secondary:
    'bg-transparent border border-[var(--color-hair-strong)] text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-warm)]',
  ghost:
    'bg-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)]',
  danger:
    'bg-[var(--color-terracotta)] text-[var(--color-paper)] hover:opacity-90',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[11px] tracking-[0.1em]',
  md: 'h-10 px-4 text-[12px] tracking-[0.08em]',
  lg: 'h-12 px-6 text-[13px] tracking-[0.06em]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-mono uppercase tracking-[0.1em] rounded-[var(--r)] transition-all duration-[140ms]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

import { cn } from '@/lib/utils';

export type IconButtonVariant = 'standard' | 'outlined' | 'filled' | 'tonal';

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: IconButtonVariant;
  size?: 'sm' | 'md';
  active?: boolean;
  children: React.ReactNode;
};

const sizeClasses = {
  sm: 'w-8 h-8 [&_svg]:size-[18px]',
  md: 'w-10 h-10 [&_svg]:size-[24px]',
} as const;

const variantClasses: Record<IconButtonVariant, string> = {
  standard: 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface-variant)_8%,transparent)] active:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface-variant)_12%,transparent)]',
  outlined: 'border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface-variant)_8%,transparent)]',
  filled: 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:shadow-[var(--md-sys-elevation-1)] hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-primary)_8%,var(--md-sys-color-primary))] active:shadow-none active:bg-[color-mix(in_srgb,var(--md-sys-color-on-primary)_12%,var(--md-sys-color-primary))]',
  tonal: 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:shadow-[var(--md-sys-elevation-1)] hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-secondary-container)_8%,var(--md-sys-color-secondary-container))] active:shadow-none active:bg-[color-mix(in_srgb,var(--md-sys-color-on-secondary-container)_12%,var(--md-sys-color-secondary-container))]',
};

const activeClasses: Record<IconButtonVariant, string> = {
  standard: 'text-[var(--md-sys-color-primary)]',
  outlined: 'bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)] border-transparent',
  filled: '',
  tonal: '',
};

export function IconButton({
  label,
  variant = 'standard',
  size = 'md',
  active = false,
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-[var(--md-sys-shape-full)] transition-all cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--md-sys-color-primary)]/50',
        'disabled:opacity-[0.38] disabled:cursor-not-allowed disabled:pointer-events-none',
        sizeClasses[size],
        variantClasses[variant],
        active && activeClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

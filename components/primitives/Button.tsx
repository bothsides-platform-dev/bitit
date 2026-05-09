import { cn } from '@/lib/utils';

export type ButtonVariant = 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonColor = 'primary' | 'error';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  children: React.ReactNode;
};

const base =
  'inline-flex items-center justify-center gap-2 ' +
  'rounded-[var(--md-sys-shape-full)] ' +
  'font-sans select-none cursor-pointer ' +
  'transition-all duration-[var(--md-sys-motion-duration-short-4)] ' +
  'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--md-sys-color-primary)]/50 ' +
  'disabled:opacity-38 disabled:cursor-not-allowed disabled:pointer-events-none';

const sizeMap: Record<ButtonSize, string> = {
  sm: [
    'h-8 px-4',
    'text-[length:var(--md-typescale-label-medium-size)]',
    'font-[number:var(--md-typescale-label-medium-weight)]',
    'tracking-[var(--md-typescale-label-medium-tracking)]',
  ].join(' '),
  md: [
    'h-10 px-6',
    'text-[length:var(--md-typescale-label-large-size)]',
    'font-[number:var(--md-typescale-label-large-weight)]',
    'tracking-[var(--md-typescale-label-large-tracking)]',
  ].join(' '),
  lg: [
    'h-12 px-8',
    'text-[length:var(--md-typescale-title-medium-size)]',
    'font-[number:var(--md-typescale-title-medium-weight)]',
    'tracking-[var(--md-typescale-title-medium-tracking)]',
  ].join(' '),
};

function variantClasses(variant: ButtonVariant, color: ButtonColor): string {
  const primary = color === 'primary';
  const bg = primary ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-error)';
  const onBg = primary ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-error)';
  const ctr = primary ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-error-container)';
  const onCtr = primary ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-error-container)';
  const txt = primary ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-error)';

  switch (variant) {
    case 'filled':
      return [
        `bg-[${bg}] text-[${onBg}]`,
        `hover:shadow-[var(--md-sys-elevation-1)]`,
        `hover:bg-[color-mix(in_srgb,${onBg}_8%,${bg})]`,
        `active:shadow-none active:bg-[color-mix(in_srgb,${onBg}_12%,${bg})]`,
      ].join(' ');
    case 'outlined':
      return [
        `bg-transparent text-[${txt}]`,
        'border border-[var(--md-sys-color-outline)]',
        `hover:bg-[color-mix(in_srgb,${bg}_8%,transparent)]`,
        `active:bg-[color-mix(in_srgb,${bg}_12%,transparent)]`,
        `focus-visible:border-[${bg}]`,
      ].join(' ');
    case 'text':
      return [
        `bg-transparent text-[${txt}] px-3`,
        `hover:bg-[color-mix(in_srgb,${bg}_8%,transparent)]`,
        `active:bg-[color-mix(in_srgb,${bg}_12%,transparent)]`,
      ].join(' ');
    case 'elevated':
      return [
        'bg-[var(--md-sys-color-surface-container-low)]',
        `text-[${txt}]`,
        'shadow-[var(--md-sys-elevation-1)]',
        `hover:shadow-[var(--md-sys-elevation-2)] hover:bg-[color-mix(in_srgb,${bg}_8%,var(--md-sys-color-surface-container-low))]`,
        `active:shadow-[var(--md-sys-elevation-1)] active:bg-[color-mix(in_srgb,${bg}_12%,var(--md-sys-color-surface-container-low))]`,
      ].join(' ');
    case 'tonal':
      return [
        `bg-[${ctr}] text-[${onCtr}]`,
        `hover:shadow-[var(--md-sys-elevation-1)] hover:bg-[color-mix(in_srgb,${onCtr}_8%,${ctr})]`,
        `active:shadow-none active:bg-[color-mix(in_srgb,${onCtr}_12%,${ctr})]`,
      ].join(' ');
  }
}

export function Button({
  variant = 'filled',
  size = 'md',
  color = 'primary',
  fullWidth = false,
  icon,
  trailingIcon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        base,
        sizeMap[size],
        variantClasses(variant, color),
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {icon && <span className="[&_svg]:size-[18px] shrink-0">{icon}</span>}
      {children}
      {trailingIcon && <span className="[&_svg]:size-[18px] shrink-0">{trailingIcon}</span>}
    </button>
  );
}

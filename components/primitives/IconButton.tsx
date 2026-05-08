import { cn } from '@/lib/utils';

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  active?: boolean;
};

export function IconButton({
  label,
  children,
  size = 'md',
  active = false,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors duration-[140ms]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        size === 'sm' ? 'w-7 h-7' : 'w-9 h-9',
        active
          ? 'text-[var(--color-ink)] bg-[var(--color-paper-warm)]'
          : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

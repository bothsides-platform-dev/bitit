import { cn } from '@/lib/utils';

type AvatarColor = 'lavender' | 'amber' | 'moss' | 'accent' | 'terra' | 'ink';

type AvatarProps = {
  name: string;
  color?: AvatarColor;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const colorMap: Record<AvatarColor, string> = {
  lavender: 'bg-[var(--color-lavender)] text-[var(--color-paper)]',
  amber: 'bg-[var(--color-amber)] text-[var(--color-paper)]',
  moss: 'bg-[var(--color-moss)] text-[var(--color-paper)]',
  accent: 'bg-[var(--color-accent)] text-[var(--color-paper)]',
  terra: 'bg-[var(--color-terracotta)] text-[var(--color-paper)]',
  ink: 'bg-[var(--color-ink)] text-[var(--color-paper)]',
};

const sizeMap: Record<string, string> = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-[12px]',
  lg: 'w-10 h-10 text-[14px]',
};

export function Avatar({ name, color = 'ink', size = 'md', className }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--r-sm)] font-mono font-medium tracking-tight select-none shrink-0',
        colorMap[color],
        sizeMap[size],
        className,
      )}
      aria-label={name}
    >
      {initials}
    </span>
  );
}

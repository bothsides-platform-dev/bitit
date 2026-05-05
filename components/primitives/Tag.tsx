import { cn } from '@/lib/utils';

type TagVariant = 'default' | 'amber' | 'terracotta' | 'moss' | 'lavender' | 'muted';

type TagProps = {
  children: React.ReactNode;
  variant?: TagVariant;
  className?: string;
};

const variantClass: Record<TagVariant, string> = {
  default: 'text-[var(--color-ink)]',
  amber: 'text-[var(--color-amber)]',
  terracotta: 'text-[var(--color-terracotta)]',
  moss: 'text-[var(--color-moss)]',
  lavender: 'text-[var(--color-lavender)]',
  muted: 'text-[var(--color-ink-soft)]',
};

export function Tag({ children, variant = 'default', className }: TagProps) {
  return (
    <span
      className={cn(
        'font-mono text-[11px] tracking-[0.1em] uppercase',
        variantClass[variant],
        className,
      )}
    >
      <span className="opacity-50">[ </span>
      {children}
      <span className="opacity-50"> ]</span>
    </span>
  );
}

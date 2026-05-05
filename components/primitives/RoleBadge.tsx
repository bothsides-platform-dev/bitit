import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types/user';

const label: Record<Role, string> = { admin: 'ADMIN', member: 'MEMBER' };

type RoleBadgeProps = { role: Role; className?: string };

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        'font-mono text-[10px] tracking-[0.14em] uppercase',
        role === 'admin' ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-soft)]',
        className,
      )}
    >
      {label[role]}
    </span>
  );
}

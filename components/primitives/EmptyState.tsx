import { cn } from '@/lib/utils';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-5 py-20 text-center',
        className,
      )}
    >
      {icon && (
        <span className="text-[var(--color-ink-faint)]">{icon}</span>
      )}
      <div className="space-y-2">
        <p className="text-[13px] text-[var(--color-ink-muted)]">{title}</p>
        {description && (
          <p className="text-[12px] text-[var(--color-ink-soft)]">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
      <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-faint)]">
        — FIN —
      </span>
    </div>
  );
}

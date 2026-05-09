import { cn } from '@/lib/utils';

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div
      className={cn(
        'min-h-svh bg-[var(--md-sys-color-background)]',
        'grid',
        className,
      )}
      style={{
        gridTemplateColumns: 'var(--shell-rail) 1fr',
        gridTemplateRows: 'var(--shell-topbar) 1fr',
        gridTemplateAreas: `
          "sidebar topbar"
          "sidebar content"
        `,
      }}
    >
      {children}
    </div>
  );
}

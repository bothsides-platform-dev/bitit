import { cn } from '@/lib/utils';

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-[var(--color-paper)]',
        'grid',
        className,
      )}
      style={{
        gridTemplateColumns: 'var(--shell-sidebar) 1fr',
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

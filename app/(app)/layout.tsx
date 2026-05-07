import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { IconSidebar } from '@/components/shell/IconSidebar';
import { Topbar } from '@/components/shell/Topbar';
import { NotificationDrawer } from '@/components/shell/NotificationDrawer';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { GlobalShortcuts } from '@/components/shell/GlobalShortcuts';
import { SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '@/auth';
import { getWorkspaceRepo } from '@/lib/server/repositories/factory';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single auth() call at the shell layer. Child RSCs that need session re-call
  // auth() themselves (no prop drilling) — the underlying JWT cookie read is
  // cheap and React/Next dedupe identical fetches inside one render.
  const session = await auth();
  if (!session?.user?.id || !session.user.workspaceId || !session.user.workspaceType) {
    redirect('/login');
  }

  // Workspace name fetch — one extra DB hit per app-page render. Acceptable
  // for v0 (single-instance, low traffic). If it becomes hot, wrap with
  // React `cache()` so multiple components within the same render share it.
  const ws = await (await getWorkspaceRepo()).findById(session.user.workspaceId);
  const workspaceName = ws?.name ?? '';

  return (
    <SidebarProvider
      style={{ '--sidebar-width': 'var(--shell-sidebar)', '--sidebar-width-icon': 'var(--shell-sidebar)' } as React.CSSProperties}
      className="contents"
    >
      <AppShell>
        <IconSidebar workspaceType={session.user.workspaceType} />
        <Topbar
          user={{
            id: session.user.id,
            email: session.user.email,
            name: session.user.name ?? session.user.email,
          }}
          workspaceType={session.user.workspaceType}
          workspaceName={workspaceName}
        />
        <main style={{ gridArea: 'content' }} className="overflow-y-auto">
          {children}
        </main>
        <NotificationDrawer />
        <CommandPalette />
        <GlobalShortcuts />
      </AppShell>
    </SidebarProvider>
  );
}

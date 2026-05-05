import { AppShell } from '@/components/shell/AppShell';
import { IconSidebar } from '@/components/shell/IconSidebar';
import { Topbar } from '@/components/shell/Topbar';
import { NotificationDrawer } from '@/components/shell/NotificationDrawer';
import { CommandPalette } from '@/components/shell/CommandPalette';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <IconSidebar />
      <Topbar />
      <main style={{ gridArea: 'content' }} className="overflow-y-auto">
        {children}
      </main>
      <NotificationDrawer />
      <CommandPalette />
    </AppShell>
  );
}

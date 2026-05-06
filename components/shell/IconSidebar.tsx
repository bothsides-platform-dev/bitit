'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { HomeIcon, FileTextIcon, InboxIcon, SettingsIcon } from '@/components/icons';
import { Logo } from '@/components/primitives/Logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

type NavItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
};

const navItems: NavItem[] = [
  { href: '/home', icon: <HomeIcon />, label: '홈' },
  { href: '/rfq', icon: <FileTextIcon />, label: '견적' },
  { href: '/inbox', icon: <InboxIcon />, label: '수신함' },
  { href: '/settings/profile', icon: <SettingsIcon />, label: '설정' },
];

export function IconSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="none"
      style={{ gridArea: 'sidebar' }}
      className="row-span-2 items-center border-r border-sidebar-border py-4"
    >
      <SidebarHeader className="mb-8 items-center p-0">
        <Logo variant="compact" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="items-center gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={active}
                  render={<Link href={item.href} aria-label={item.label} />}
                  className={cn(
                    'relative h-auto w-12 flex-col justify-center gap-1 rounded-[var(--r)] py-2 text-center text-[10px] leading-none tracking-[0.02em]',
                    'opacity-40 transition-opacity duration-[140ms]',
                    'hover:bg-transparent hover:text-sidebar-foreground hover:opacity-80',
                    '[&_svg]:size-5',
                    'data-active:bg-transparent data-active:font-normal data-active:opacity-100',
                    'data-active:before:absolute data-active:before:left-0 data-active:before:top-1/2 data-active:before:h-5 data-active:before:w-0.5 data-active:before:-translate-y-1/2 data-active:before:bg-[var(--color-amber)]',
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="mb-1 items-center p-0">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-sidebar-foreground opacity-20 [writing-mode:vertical-lr] rotate-180">
          v0 · 2026
        </span>
      </SidebarFooter>
    </Sidebar>
  );
}

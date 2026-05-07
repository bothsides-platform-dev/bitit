import { Subnav } from '@/components/shell/Subnav';

const items = [
  { href: '/settings/profile', label: '프로필' },
  { href: '/settings/members', label: '멤버' },
  { href: '/settings/notifications', label: '알림' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-full">
      <Subnav title="SETTINGS" items={items} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

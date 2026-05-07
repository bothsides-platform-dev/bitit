import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '견적 초청',
  robots: { index: false, follow: false },
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}

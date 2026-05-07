import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '비밀번호',
  robots: { index: false, follow: false },
};

export default function PasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}

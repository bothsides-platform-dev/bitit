'use client';

import { usePathname } from 'next/navigation';
import { MOCK_SESSION_BUYER, MOCK_SESSION_PG } from './workspaces';
import { MOCK_USERS } from './users';
import type { User } from '@/lib/types/user';

const PG_PREFIXES = ['/inbox', '/invite/rfq'];

export type SessionView = {
  session: typeof MOCK_SESSION_BUYER | typeof MOCK_SESSION_PG;
  user: User | undefined;
};

export function useMockSession(): SessionView {
  const pathname = usePathname();
  const isPg = pathname
    ? PG_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
    : false;
  const session = isPg ? MOCK_SESSION_PG : MOCK_SESSION_BUYER;
  const user = MOCK_USERS.find((u) => u.id === session.userId);
  return { session, user };
}

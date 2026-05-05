import type { User } from '@/lib/types/user';

export const MOCK_USERS: User[] = [
  {
    id: 'u-buyer-001',
    name: '이성연',
    email: 'yeonseong.dev@gmail.com',
    avatarColor: 'accent',
    role: 'admin',
    status: 'active',
    joinedAt: '2026-04-01T09:00:00Z',
    lastSeenAt: '2026-05-05T08:30:00Z',
  },
  {
    id: 'u-pg-001',
    name: '김토스',
    email: 'kim@toss.im',
    avatarColor: 'lavender',
    role: 'admin',
    status: 'active',
    joinedAt: '2026-04-10T10:00:00Z',
    lastSeenAt: '2026-05-04T17:00:00Z',
  },
  {
    id: 'u-pg-002',
    name: '박이니시스',
    email: 'park@inicis.com',
    avatarColor: 'moss',
    role: 'admin',
    status: 'active',
    joinedAt: '2026-04-11T10:00:00Z',
    lastSeenAt: '2026-05-03T15:00:00Z',
  },
  {
    id: 'u-pg-003',
    name: '최카카오',
    email: 'choi@kakaopay.com',
    avatarColor: 'amber',
    role: 'admin',
    status: 'active',
    joinedAt: '2026-04-12T10:00:00Z',
    lastSeenAt: '2026-05-02T12:00:00Z',
  },
];

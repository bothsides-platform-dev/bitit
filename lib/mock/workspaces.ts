import type { Workspace } from '@/lib/types/workspace';
import { MOCK_USERS } from './users';

export const MOCK_WORKSPACES: Workspace[] = [
  {
    id: 'ws-buyer-001',
    type: 'buyer',
    name: '(주)샘플테크',
    bizProfile: {
      bizNo: '123-45-67890',
      name: '(주)샘플테크',
      ceoName: '이성연',
      ksic: '6201',
      taxType: 'general',
      status: 'active',
      mailOrderNo: '2024-서울-01234',
      estimatedRevenue: 1_200_000_000,
      revenueYear: '2025',
      grade: 'sme2',
      gradeSource: 'auto_nice',
    },
    members: [MOCK_USERS[0]],
    createdAt: '2026-04-01T09:00:00Z',
  },
  {
    id: 'ws-pg-toss',
    type: 'pg',
    name: '토스페이먼츠',
    domain: 'toss.im',
    members: [MOCK_USERS[1]],
    createdAt: '2026-04-10T10:00:00Z',
  },
  {
    id: 'ws-pg-inicis',
    type: 'pg',
    name: 'KG이니시스',
    domain: 'inicis.com',
    members: [MOCK_USERS[2]],
    createdAt: '2026-04-11T10:00:00Z',
  },
  {
    id: 'ws-pg-kakao',
    type: 'pg',
    name: '카카오페이',
    domain: 'kakaopay.com',
    members: [MOCK_USERS[3]],
    createdAt: '2026-04-12T10:00:00Z',
  },
];

export const MOCK_SESSION_PG = {
  userId: 'u-pg-001',
  email: 'kim@toss.im',
  workspaceId: 'ws-pg-toss',
  workspaceType: 'pg' as const,
  role: 'admin' as const,
  name: '김영업',
};

export const MOCK_SESSION_BUYER = {
  userId: 'u-buyer-001',
  email: 'yeonseong.dev@gmail.com',
  workspaceId: 'ws-buyer-001',
  workspaceType: 'buyer' as const,
  role: 'admin' as const,
  name: '이성연',
};

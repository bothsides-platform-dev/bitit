import type { RfqInvitation } from '@/lib/types/invitation';

export const MOCK_INVITATIONS: RfqInvitation[] = [
  {
    id: 'inv-001',
    rfqId: 'Q-2604-0001',
    pgEmail: 'kim@toss.im',
    pgWsId: 'ws-pg-toss',
    acceptedByUserId: 'u-pg-001',
    uniqueToken: 'tok_toss_abc123',
    sentAt: '2026-04-28T09:05:00Z',
    openedAt: '2026-04-28T10:00:00Z',
    expiresAt: '2026-05-20T23:59:59Z',
    status: 'accepted',
  },
  {
    id: 'inv-002',
    rfqId: 'Q-2604-0001',
    pgEmail: 'park@inicis.com',
    pgWsId: 'ws-pg-inicis',
    acceptedByUserId: 'u-pg-002',
    uniqueToken: 'tok_inicis_def456',
    sentAt: '2026-04-28T09:05:00Z',
    openedAt: '2026-04-29T09:00:00Z',
    expiresAt: '2026-05-20T23:59:59Z',
    status: 'accepted',
  },
  {
    id: 'inv-003',
    rfqId: 'Q-2604-0001',
    pgEmail: 'choi@kakaopay.com',
    pgWsId: 'ws-pg-kakao',
    uniqueToken: 'tok_kakao_ghi789',
    sentAt: '2026-04-28T09:05:00Z',
    expiresAt: '2026-05-20T23:59:59Z',
    status: 'sent',
  },
];

import type { Notification } from '@/lib/types/notification';

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    userId: 'u-buyer-001',
    workspaceId: 'ws-buyer-001',
    type: 'bid_submitted',
    title: '토스페이먼츠 견적 도착',
    body: 'Q-2604-0001 RFQ에 토스페이먼츠가 견적을 제출했습니다.',
    channel: 'inapp',
    status: 'pending',
    linkUrl: '/rfq/Q-2604-0001',
    createdAt: '2026-05-01T14:01:00Z',
  },
  {
    id: 'notif-002',
    userId: 'u-buyer-001',
    workspaceId: 'ws-buyer-001',
    type: 'bid_submitted',
    title: 'KG이니시스 견적 도착',
    body: 'Q-2604-0001 RFQ에 KG이니시스가 견적을 제출했습니다.',
    channel: 'inapp',
    status: 'pending',
    linkUrl: '/rfq/Q-2604-0001',
    createdAt: '2026-05-02T11:01:00Z',
  },
];

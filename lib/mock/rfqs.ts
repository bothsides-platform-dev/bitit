import type { RFQ } from '@/lib/types/rfq';

export const MOCK_RFQS: RFQ[] = [
  {
    id: 'Q-2604-0001',
    buyerWsId: 'ws-buyer-001',
    bizProfile: {
      bizNo: '123-45-67890',
      taxType: 'general',
      status: 'active',
      grade: 'sme2',
      gradeSource: 'user_confirmed',
    },
    title: '2026년 하반기 PG 서비스 견적 요청',
    memo: '카드결제 + 간편결제 통합 솔루션 검토 중입니다. 정산주기 D+1 이내 희망.',
    rfpFiles: [],
    allowedPgEmails: ['kim@toss.im', 'park@inicis.com', 'choi@kakaopay.com'],
    deadline: '2026-05-20T23:59:59Z',
    status: 'sent',
    createdBy: 'u-buyer-001',
    createdAt: '2026-04-28T09:00:00Z',
    sentAt: '2026-04-28T09:05:00Z',
  },
  {
    id: 'Q-2605-0001',
    buyerWsId: 'ws-buyer-001',
    bizProfile: {
      bizNo: '123-45-67890',
      taxType: 'general',
      status: 'active',
      grade: 'sme2',
      gradeSource: 'user_confirmed',
    },
    title: '2026년 하반기 PG 수수료 추가 검토',
    memo: '이전 견적 대비 정산 조건 개선 여부 확인.',
    rfpFiles: [],
    allowedPgEmails: ['kim@toss.im', 'park@inicis.com'],
    deadline: '2026-05-25T23:59:59Z',
    status: 'draft',
    createdBy: 'u-buyer-001',
    createdAt: '2026-05-05T08:00:00Z',
  },
];

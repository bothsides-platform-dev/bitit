import type { Attachment } from './common';
import type { MerchantGrade } from './biz-profile';

export type SettlementCycle = 'D+0' | 'D+1' | 'D+2' | 'weekly' | 'monthly';
export type CardIssuer =
  | 'BC' | 'SHINHAN' | 'SAMSUNG' | 'HYUNDAI' | 'KB'
  | 'LOTTE' | 'NH' | 'HANA' | 'WOORI';

export const STATUTORY_CARD_FEE: Record<MerchantGrade, number> = {
  small: 0.005,
  sme1: 0.011,
  sme2: 0.0125,
  sme3: 0.015,
  general: Number.NaN,
};

export type Bid = {
  id: string;
  rfqId: string;
  pgWsId: string;
  invitationId: string;
  settleCycle: SettlementCycle;
  deposit: number;
  setupFee: number;
  monthlyMin: number;
  bankTransferFeePct: number;
  easyPayFeePct: number;
  cardFeesByIssuer?: Record<CardIssuer, number>;
  overseasCardFeePct?: number;
  proposalPdf: Attachment;
  memo?: string;
  status: 'draft' | 'submitted' | 'withdrawn';
  submittedBy: string;
  submittedAt?: string;
};

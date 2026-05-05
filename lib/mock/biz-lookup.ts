import type { BizProfile, MerchantGrade } from '@/lib/types/biz-profile';

type BizRecord = Omit<BizProfile, 'grade' | 'gradeSource' | 'gradeConfirmedBy' | 'gradeConfirmedAt' | 'estimatedRevenue' | 'revenueYear' | 'niceLookedUpAt'>;
type NiceRecord = { grade: MerchantGrade; estimatedRevenue: number; revenueYear: string };

const BIZ_DB: Record<string, BizRecord> = {
  '123-45-67890': {
    bizNo: '123-45-67890',
    name: '(주)샘플테크',
    ceoName: '이성연',
    ksic: '6201',
    taxType: 'general',
    status: 'active',
    mailOrderNo: '2024-서울-01234',
  },
  '234-56-78901': {
    bizNo: '234-56-78901',
    name: '노온커머스(주)',
    ceoName: '박지현',
    ksic: '4791',
    taxType: 'general',
    status: 'active',
    mailOrderNo: '2023-경기-05678',
  },
  '345-67-89012': {
    bizNo: '345-67-89012',
    name: '스타트업빌더(주)',
    ceoName: '김민준',
    ksic: '6201',
    taxType: 'simple',
    status: 'active',
  },
};

const NICE_DB: Record<string, NiceRecord> = {
  '123-45-67890': { grade: 'sme2', estimatedRevenue: 820_000_000, revenueYear: '2025' },
  '234-56-78901': { grade: 'sme3', estimatedRevenue: 2_400_000_000, revenueYear: '2025' },
  '345-67-89012': { grade: 'small', estimatedRevenue: 180_000_000, revenueYear: '2025' },
};

export async function lookupBizNo(bizNo: string): Promise<BizRecord | null> {
  await new Promise((r) => setTimeout(r, 700));
  return BIZ_DB[bizNo] ?? null;
}

export async function lookupNiceGrade(bizNo: string): Promise<NiceRecord | null> {
  await new Promise((r) => setTimeout(r, 1_000));
  return NICE_DB[bizNo] ?? null;
}

export const GRADE_LABELS: Record<MerchantGrade, string> = {
  small: '영세',
  sme1: '중소 1',
  sme2: '중소 2',
  sme3: '중소 3',
  general: '일반',
};

export const KSIC_LABELS: Record<string, string> = {
  '6201': 'J62 소프트웨어 개발',
  '4791': 'G47 전자상거래 소매',
};

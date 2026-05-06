export type MerchantGrade = 'small' | 'sme1' | 'sme2' | 'sme3' | 'general';

export type BizProfile = {
  bizNo: string;
  taxType: 'general' | 'simple' | 'exempt';
  status: 'active' | 'suspended' | 'closed';
  grade?: MerchantGrade;
  gradeSource: 'user_confirmed' | 'user_overridden';
  gradeConfirmedBy?: string;
  gradeConfirmedAt?: string;
};

// 가맹점 등급 라벨 — 영세/중소1~3/일반. lib/mock/biz-lookup.ts에도 임시 복제본이
// 살아있으나 모든 신규 import는 이 파일에서 가져온다(Step 13 mock 컷오버에서
// 잔존본을 일괄 정리). 공백 없는 표기 — 'sme1' → '중소1'.
export const GRADE_LABELS: Record<MerchantGrade, string> = {
  small: '영세',
  sme1: '중소1',
  sme2: '중소2',
  sme3: '중소3',
  general: '일반',
};

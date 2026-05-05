export type MerchantGrade = 'small' | 'sme1' | 'sme2' | 'sme3' | 'general';

export type BizProfile = {
  bizNo: string;
  name: string;
  ceoName: string;
  ksic: string;
  taxType: 'general' | 'simple' | 'exempt';
  status: 'active' | 'suspended' | 'closed';
  mailOrderNo?: string;
  estimatedRevenue?: number;
  revenueYear?: string;
  niceLookedUpAt?: string;
  grade?: MerchantGrade;
  gradeSource: 'auto_nice' | 'user_confirmed' | 'user_overridden';
  gradeConfirmedBy?: string;
  gradeConfirmedAt?: string;
};

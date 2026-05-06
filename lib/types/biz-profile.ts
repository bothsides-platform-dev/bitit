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

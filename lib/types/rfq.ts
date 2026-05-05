import type { Attachment } from './common';
import type { BizProfile } from './biz-profile';

export type RfqStatus = 'draft' | 'sent' | 'closed' | 'cancelled' | 'awarded';

export type RFQ = {
  id: string;
  buyerWsId: string;
  bizProfile: BizProfile;
  title: string;
  memo: string;
  rfpFiles: Attachment[];
  allowedPgEmails: string[];
  deadline: string;
  status: RfqStatus;
  awardedBidId?: string;
  createdBy: string;
  createdAt: string;
  sentAt?: string;
};

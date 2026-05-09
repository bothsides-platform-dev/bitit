import type { Attachment } from './common';
import type { BizProfile } from './biz-profile';

export type RfqStatus = 'draft' | 'sent' | 'closed' | 'cancelled' | 'awarded';

export type RFQ = {
  id: string;
  buyerWsId: string;
  bizProfile?: BizProfile;
  title: string;
  memo: string;
  rfpFiles: Attachment[];
  allowedPgWorkspaceIds: string[];
  deadline: string;
  status: RfqStatus;
  awardedBidId?: string;
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  // RFQ-scoped permanent share token (raw). Populated by the repo layer; only
  // surfaced server-side for the buyer's detail page → never serialised to PG
  // clients. Optional on type so PG-side renders that omit it stay sound.
  shareToken?: string;
};

export type InvitationStatus =
  | 'draft'
  | 'sent'
  | 'opened'
  | 'accepted'
  | 'declined'
  | 'expired';

export type InvitationSource = 'request' | 'recommendation';

export type RfqInvitation = {
  id: string;
  rfqId: string;
  pgWsId: string;
  acceptedByUserId?: string;
  uniqueToken: string;
  sentAt: string;
  openedAt?: string;
  expiresAt: string;
  status: InvitationStatus;
  source?: InvitationSource;
};

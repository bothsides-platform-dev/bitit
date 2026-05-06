// Props for the 7 react-email templates wired to outbox events.
// Each interface mirrors what the corresponding action passes when it builds
// the email body. Keep this file dependency-free so it can be imported from
// templates, actions, and tests without pulling React.

export interface AuthVerifyProps {
  verifyUrl: string;
  expiresMinutes: number;
}

export interface AuthResetProps {
  resetUrl: string;
  expiresMinutes: number;
}

export interface AuthEmailChangeProps {
  confirmUrl: string;
  newEmail: string;
  expiresHours: number;
}

export interface RfqInvitedProps {
  rfqId: string;
  rfqTitle: string;
  buyerName: string;
  deadline: string;
  inviteUrl: string;
}

export interface RfqSentProps {
  rfqId: string;
  rfqTitle: string;
  inviteCount: number;
}

export interface BidSubmittedProps {
  rfqId: string;
  rfqTitle: string;
  pgName: string;
  submittedAt: string;
}

export interface RfqAwardedProps {
  rfqId: string;
  rfqTitle: string;
  bidId: string;
  settlementCycle: string;
}

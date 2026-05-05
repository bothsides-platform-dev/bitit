export type NotificationChannel = 'email' | 'inapp';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';

export type Notification = {
  id: string;
  userId: string;
  workspaceId: string;
  type: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  linkUrl?: string;
  createdAt: string;
  sentAt?: string;
  readAt?: string;
};

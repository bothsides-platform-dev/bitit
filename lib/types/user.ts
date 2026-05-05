export type Role = 'admin' | 'member';

export type User = {
  id: string;
  name: string;
  email: string;
  avatarColor: 'lavender' | 'amber' | 'moss' | 'accent' | 'terra' | 'ink';
  role: Role;
  status: 'active' | 'paused';
  groupId?: string;
  joinedAt: string;
  lastSeenAt?: string;
};

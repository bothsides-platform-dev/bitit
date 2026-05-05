import type { BizProfile } from './biz-profile';
import type { User } from './user';

export type WorkspaceType = 'buyer' | 'pg';

export type Workspace = {
  id: string;
  type: WorkspaceType;
  name: string;
  domain?: string;
  bizProfile?: BizProfile;
  members: User[];
  createdAt: string;
};

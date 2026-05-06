import 'next-auth';
import 'next-auth/jwt';

type WorkspaceType = 'buyer' | 'pg';
type MemberRole = 'admin' | 'member';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      workspaceId?: string;
      workspaceType?: WorkspaceType;
      role?: MemberRole;
    };
  }

  interface User {
    workspaceId?: string;
    workspaceType?: WorkspaceType;
    role?: MemberRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    workspaceId?: string;
    workspaceType?: WorkspaceType;
    role?: MemberRole;
  }
}

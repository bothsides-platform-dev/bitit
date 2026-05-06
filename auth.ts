/**
 * Node-runtime Auth.js v5 entry point.
 *
 * Exports `handlers`, `auth`, `signIn`, `signOut` — the full config with
 * a DB-touching `authorize` callback. Used by:
 * - `app/api/auth/[...nextauth]/route.ts` (route handler GET/POST)
 * - Server components / server actions via `auth()` and `lib/auth/session.ts`
 * - `app/logout/route.ts` via `signOut`
 *
 * `proxy.ts` must NOT import this module — it imports `auth.config.ts`
 * directly to stay edge-safe.
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';

import authConfig from './auth.config';
import { db } from '@/lib/db/client';
import { users, workspaceMembers, workspaces } from '@/lib/db/schema';
import { verifyPassword } from '@/lib/auth/password';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const email = String(creds.email).toLowerCase().trim();
        const password = String(creds.password);

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        const [member] = await db
          .select({
            workspaceId: workspaceMembers.workspaceId,
            role: workspaceMembers.role,
            workspaceType: workspaces.type,
          })
          .from(workspaceMembers)
          .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
          .where(eq(workspaceMembers.userId, user.id))
          .limit(1);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          workspaceId: member?.workspaceId,
          workspaceType: member?.workspaceType,
          role: member?.role,
        };
      },
    }),
  ],
});

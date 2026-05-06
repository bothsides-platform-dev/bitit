/**
 * Edge-safe Auth.js v5 base config.
 *
 * Imported by both `auth.ts` (Node runtime — full config with DB-touching
 * `authorize`) and `proxy.ts` (Edge runtime — token-only, no DB).
 *
 * Hard rule: this file MUST NOT import anything that pulls a Node-only
 * driver into the bundle (postgres-js, bcryptjs, fs, etc.). It only
 * declares the JWT shape, callbacks, pages, and an empty Credentials
 * shell so the matcher in `proxy.ts` recognises the provider type.
 */
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export default {
  providers: [
    // Empty shell — the real `authorize` lives in `auth.ts`.
    // Kept here so `proxy.ts` can run the JWT-only `auth()` wrapper without
    // triggering edge-incompatible imports.
    Credentials({ credentials: {}, authorize: async () => null }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.workspaceId = user.workspaceId;
        token.workspaceType = user.workspaceType;
        token.role = user.role;
      }
      // `trigger === 'update'` re-reads workspace state from DB. Implemented
      // in Step 5+ via a server action that calls `unstable_update`. For v0
      // the first-login stamp is sufficient.
      void trigger;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.workspaceId = token.workspaceId;
        session.user.workspaceType = token.workspaceType;
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

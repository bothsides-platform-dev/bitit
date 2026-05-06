import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import authConfig from './auth.config';
import { decideRoute } from './lib/auth/route-decision';

// Edge-runtime-only: instantiated from `auth.config.ts` (no DB, no bcrypt).
// `auth.ts` would pull postgres-js into the edge bundle and break the build.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const decision = decideRoute(pathname, search, isAuthenticated);

  if (decision.kind === 'redirect') {
    return NextResponse.redirect(new URL(decision.to, req.url));
  }
  return NextResponse.next();
});

// Exclude `/api` (especially `/api/auth/*` for NextAuth handlers) and Next
// internals/static assets. Pre-Auth.js this read `(?!_next|favicon|...)` —
// `api` is added because `api/auth/*` would otherwise 302 to `/login`.
export const config = {
  matcher: [
    '/((?!api|_next|favicon.ico|fonts|file|globe|next|vercel|window).*)',
  ],
};

/**
 * Pure routing decision used by both `proxy.ts` (Auth.js-wrapped) and unit tests.
 *
 * Keeping this free of any `next-auth` / DB imports is critical:
 * - proxy.ts runs in the Edge runtime; this module must stay edge-safe (no Node deps).
 * - tests can exercise the four redirect cases without instantiating NextAuth.
 *
 * The four cases (see Step 3 spec) are:
 *   1. unauth + `(app)/*`              → `/login?next=<encoded>`
 *   2. auth   + `(public)/*` (≠ `/logout`) → `/home`
 *   3. any    + `/invite/rfq/*`        → pass-through
 *   4. any    + `/logout`              → pass-through
 */

export const PUBLIC_PREFIXES = [
  '/login',
  '/signup',
  '/password',
  '/invite',
  '/auth',
  '/logout',
];

export const CLAIMABLE_PUBLIC_PREFIXES = ['/invite/rfq'];

export type RouteDecision =
  | { kind: 'next' }
  | { kind: 'redirect'; to: string };

export function decideRoute(
  pathname: string,
  search: string,
  isAuthenticated: boolean,
): RouteDecision {
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
  const isClaimableInvite = CLAIMABLE_PUBLIC_PREFIXES.some((p) =>
    pathname.startsWith(p),
  );

  if (isPublic) {
    if (isClaimableInvite) return { kind: 'next' };
    if (isAuthenticated && pathname !== '/logout') {
      return { kind: 'redirect', to: '/home' };
    }
    return { kind: 'next' };
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(pathname + search);
    return { kind: 'redirect', to: `/login?next=${next}` };
  }

  return { kind: 'next' };
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PREFIXES = ['/login', '/signup', '/password', '/invite', '/auth', '/logout'];
const CLAIMABLE_PUBLIC_PREFIXES = ['/invite/rfq'];

function readSessionCookie(req: NextRequest): string | undefined {
  return req.cookies.get('session')?.value;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = readSessionCookie(req);
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
  const isClaimableInvite = CLAIMABLE_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (isPublic) {
    if (isClaimableInvite) return NextResponse.next();
    if (session && pathname !== '/logout') {
      return NextResponse.redirect(new URL('/home', req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const next = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(new URL(`/login?next=${next}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|fonts|file|globe|next|vercel|window).*)'],
};

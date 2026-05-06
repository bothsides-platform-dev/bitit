import { NextResponse } from 'next/server';
import { signOut } from '@/auth';

export async function POST(req: Request) {
  await signOut({ redirect: false });
  return NextResponse.redirect(new URL('/login', req.url), 302);
}

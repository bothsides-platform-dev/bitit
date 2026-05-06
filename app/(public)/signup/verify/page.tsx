'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { readSignupDraft } from '@/lib/auth/signup-storage';

// MARK FOR DELETION — Step 13.
// Step 5 unified the verify entry point at /auth/verify; this route now
// proxies to that page so any older mail link or bookmark still lands in
// the right place. New email templates point directly at /auth/verify.
function RedirectShell() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email') ?? readSignupDraft().email;
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (email && !token) params.set('email', email);
    const qs = params.toString();
    router.replace(qs ? `/auth/verify?${qs}` : '/auth/verify');
  }, [router, searchParams]);

  return (
    <p className="font-mono text-[12px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)] text-center">
      LOADING…
    </p>
  );
}

export default function SignupVerifyPage() {
  return (
    <Suspense fallback={<p className="font-mono text-[12px] tracking-[0.16em] uppercase text-center">LOADING…</p>}>
      <RedirectShell />
    </Suspense>
  );
}

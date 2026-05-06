'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  readSignupDraft,
  writeSignupDraft,
} from '@/lib/auth/signup-storage';

type Props = { params: Promise<{ token: string }> };

// Step 5: this is the unauthenticated landing for an RFQ invite. We stash
// the raw token into sessionStorage so the signup flow can carry it through
// /signup → /auth/verify → /signup/profile → /signup/workspace, then redirect
// to /login?next=/invite/rfq/<token> for users who already have an account.
//
// Authenticated direct claim is owned by Step 8 (claimInviteTokenAction); for
// now an authed user redirected here is asked to re-enter via /login (the
// middleware will bounce them back into /home if their session is valid).
export default function InviteRfqPage({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();

  useEffect(() => {
    const draft = readSignupDraft();
    writeSignupDraft({ ...draft, inviteToken: token });
    const next = `/invite/rfq/${token}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [token, router]);

  return (
    <div className="py-8 text-center">
      <p className="font-mono text-[12px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">
        LOADING…
      </p>
      <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
        초대 링크를 확인하는 중입니다.
      </p>
    </div>
  );
}

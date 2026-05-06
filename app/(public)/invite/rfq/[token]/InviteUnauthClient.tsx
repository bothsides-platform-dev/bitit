'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  readSignupDraft,
  writeSignupDraft,
} from '@/lib/auth/signup-storage';

// Step 5 보존 — 비인증 사용자는 signupDraft 에 토큰 stash 후 /login?next= 로 보냄.
export function InviteUnauthClient({ token }: { token: string }) {
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

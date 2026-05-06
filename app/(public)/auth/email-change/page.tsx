'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckSvg } from '@/components/auth/EnvelopeSvg';
import Link from 'next/link';
import { emailChangeConfirmAction } from '@/lib/server/actions/auth';

type State = 'loading' | 'success' | 'failed';

function EmailChangeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<State>('loading');
  const ranOnce = useRef(false);

  useEffect(() => {
    if (!token) return;
    // Atomic-consume guard for Strict-mode double-render.
    if (ranOnce.current) return;
    ranOnce.current = true;

    let cancelled = false;
    (async () => {
      const r = await emailChangeConfirmAction({ rawToken: token });
      if (cancelled) return;
      setState(r.ok ? 'success' : 'failed');
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return <p className="text-[13px] text-[var(--color-terracotta)] text-center">잘못된 링크입니다.</p>;
  }
  if (state === 'loading') {
    return <p className="font-mono text-[12px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)] text-center">LOADING…</p>;
  }
  if (state === 'failed') {
    return (
      <div className="space-y-4 text-center">
        <p className="text-[13px] text-[var(--color-terracotta)]">링크가 만료되었거나 이미 사용되었습니다.</p>
        <Link href="/login" className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink)]">
          로그인 →
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center text-[var(--color-moss)]"><CheckSvg size={56} /></div>
      <p className="text-[14px] text-[var(--color-ink)]">이메일이 변경되었습니다.</p>
      <Link href="/login" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink)]">로그인 →</Link>
    </div>
  );
}

export default function EmailChangePage() {
  return (
    <Suspense fallback={<p className="font-mono text-[12px] tracking-[0.16em] uppercase text-center">LOADING…</p>}>
      <EmailChangeContent />
    </Suspense>
  );
}

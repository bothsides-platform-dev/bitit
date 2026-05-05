'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

type TokenState = 'loading' | 'success' | 'expired' | 'invalid' | 'used';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<TokenState>('loading');

  useEffect(() => {
    const timer = setTimeout(() => {
      // mock: 모든 토큰을 success로 처리
      if (!token) { setState('invalid'); return; }
      if (token === 'expired') { setState('expired'); return; }
      if (token === 'used') { setState('used'); return; }
      setState('success');
      setTimeout(() => router.push('/signup/profile'), 800);
    }, 1000);
    return () => clearTimeout(timer);
  }, [token, router]);

  if (state === 'loading') {
    return <p className="font-mono text-[12px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)] text-center">LOADING…</p>;
  }
  if (state === 'success') {
    return <p className="font-mono text-[12px] tracking-[0.16em] uppercase text-[var(--color-moss)] text-center">인증 완료. 이동 중…</p>;
  }
  if (state === 'expired') {
    return (
      <div className="space-y-4 text-center">
        <p className="text-[13px] text-[var(--color-terracotta)]">링크가 만료되었습니다.</p>
        <Link href="/signup" className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink)] hover:text-[var(--color-ink-muted)]">재발송 →</Link>
      </div>
    );
  }
  if (state === 'used') {
    return (
      <div className="space-y-4 text-center">
        <p className="text-[13px] text-[var(--color-ink-muted)]">이미 사용된 링크입니다.</p>
        <Link href="/login" className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink)]">로그인 →</Link>
      </div>
    );
  }
  return (
    <div className="space-y-4 text-center">
      <p className="text-[13px] text-[var(--color-terracotta)]">잘못된 링크입니다.</p>
      <Link href="/login" className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink)]">로그인 →</Link>
    </div>
  );
}

export default function AuthVerifyPage() {
  return (
    <Suspense fallback={<p className="font-mono text-[12px] tracking-[0.16em] uppercase text-center">LOADING…</p>}>
      <VerifyContent />
    </Suspense>
  );
}

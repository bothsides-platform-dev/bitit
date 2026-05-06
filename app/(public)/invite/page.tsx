'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { Avatar } from '@/components/primitives/Avatar';

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return <p className="text-[13px] text-[var(--color-terracotta)] text-center">잘못된 초대 링크입니다.</p>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-[22px] font-[700] tracking-[-0.02em] text-[var(--color-ink)] text-center leading-snug">
        <span className="text-[var(--color-ink-muted)]">홍길동</span>님이<br />
        <strong>(주)샘플테크</strong>에 초대했습니다.
      </h2>
      <div className="flex items-center gap-4 p-4 border border-[var(--color-hair)] rounded-[var(--r)]">
        <Avatar name="샘플테크" color="accent" size="lg" />
        <div>
          <p className="text-[14px] font-medium text-[var(--color-ink)]">(주)샘플테크</p>
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] mt-0.5">멤버 1명</p>
        </div>
      </div>
      <div className="space-y-3">
        <Button fullWidth size="lg" onClick={() => router.push(`/signup/pg?token=${token}`)}>가입하고 합류</Button>
        <Button fullWidth variant="secondary" size="md" onClick={() => router.push('/login')}>로그인 후 합류</Button>
        <button type="button" className="block w-full text-center font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)] hover:text-[var(--color-ink-soft)] transition-colors">
          거절하기
        </button>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<p className="font-mono text-[12px] tracking-[0.16em] uppercase text-center">LOADING…</p>}>
      <InviteContent />
    </Suspense>
  );
}

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckSvg } from '@/components/auth/EnvelopeSvg';
import Link from 'next/link';

function EmailChangeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return <p className="text-[13px] text-[var(--color-terracotta)] text-center">잘못된 링크입니다.</p>;
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

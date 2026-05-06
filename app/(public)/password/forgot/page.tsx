'use client';

import { useState } from 'react';
import { Serial } from '@/components/primitives/Serial';
import { Button } from '@/components/primitives/Button';
import { EnvelopeSvg } from '@/components/auth/EnvelopeSvg';
import { ResendCountdown } from '@/components/auth/ResendCountdown';
import Link from 'next/link';
import { passwordForgotAction } from '@/lib/server/actions/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Action always returns ok:true (info-leak protection); UI shows the same
    // confirmation regardless of whether the email was on file.
    await passwordForgotAction({ email });
    setSubmitting(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="space-y-8 text-center">
        <Serial current={1} total={2} label="PASSWORD" className="inline-block mb-4" />
        <div className="flex justify-center text-[var(--color-ink-faint)]"><EnvelopeSvg size={80} /></div>
        <div className="space-y-3">
          <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">재설정 링크를 보냈습니다</h2>
          <p className="text-[13px] text-[var(--color-ink-muted)]"><span className="font-mono tabular-nums">{email}</span></p>
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">30분 내 만료됩니다.</p>
        </div>
        <ResendCountdown onResend={() => {}} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Serial current={1} total={2} label="PASSWORD" className="block mb-4" />
        <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">비밀번호 찾기</h2>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label htmlFor="email" className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">이메일</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
            className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
            placeholder="your@email.com" />
        </div>
        <Button type="submit" fullWidth size="lg" disabled={submitting || !email.trim()}>
          {submitting ? 'LOADING…' : '재설정 링크 받기'}
        </Button>
      </form>
      <div className="text-center">
        <Link href="/login" className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">← 로그인으로</Link>
      </div>
    </div>
  );
}

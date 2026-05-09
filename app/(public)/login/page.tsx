'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { PasswordField } from '@/components/auth/PasswordField';
import { loginAction } from '@/lib/server/actions/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/home';
  const [email, setEmail] = useState(
    () => searchParams.get('email') ?? '',
  );
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const r = await loginAction({ email, password });
    setSubmitting(false);
    if (!r.ok) {
      setError('이메일 또는 비밀번호가 일치하지 않습니다.');
      return;
    }
    // Auth.js v5 sets the cookie inside the server action's signIn() call;
    // a router.push is enough to land on the protected route.
    router.push(next);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          로그인
        </h2>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label htmlFor="email" className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
            이메일
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
            placeholder="your@email.com"
          />
        </div>

        <PasswordField
          label="비밀번호"
          name="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-3.5 h-3.5 accent-[var(--color-ink)]"
          />
          <label htmlFor="rememberMe" className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] cursor-pointer">
            로그인 유지
          </label>
        </div>

        {error && (
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth size="lg" disabled={submitting || !email || !password}>
          {submitting ? 'LOADING…' : '로그인'}
        </Button>
      </form>

      <div className="flex items-center justify-between">
        <Link
          href="/password/forgot"
          className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          비밀번호를 잊으셨나요?
        </Link>
        <Link
          href="/signup"
          className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          회원가입 →
        </Link>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="font-mono text-[12px] tracking-[0.16em] uppercase text-center">LOADING…</p>}>
      <LoginContent />
    </Suspense>
  );
}

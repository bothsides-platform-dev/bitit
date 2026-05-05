'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Serial } from '@/components/primitives/Serial';
import { Button } from '@/components/primitives/Button';
import { PasswordField } from '@/components/auth/PasswordField';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [failCount] = useState(0);

  return (
    <div className="space-y-8">
      <div>
        <Serial current={1} total={2} label="LOGIN" className="block mb-4" />
        <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          로그인
        </h2>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
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

        {failCount >= 5 && (
          <div className="p-3 border border-[var(--color-hair)] text-[12px] text-[var(--color-ink-muted)] font-mono uppercase tracking-[0.08em]">
            CAPTCHA — (mock)
          </div>
        )}

        <Button type="submit" fullWidth size="lg">
          로그인
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

      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-faint)] text-center">
        — FIN —
      </p>
    </div>
  );
}

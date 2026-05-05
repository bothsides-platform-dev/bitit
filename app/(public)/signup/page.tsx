'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Serial } from '@/components/primitives/Serial';
import { Button } from '@/components/primitives/Button';
import { AgreementCheckboxes } from '@/components/auth/AgreementCheckboxes';
import { useSignupDraftStore } from '@/lib/stores/signup-draft';

type AgreementState = { terms: boolean; privacy: boolean; marketing: boolean };

export default function SignupPage() {
  const router = useRouter();
  const { setEmail, setAgreedAt } = useSignupDraftStore();
  const [email, setEmailLocal] = useState('');
  const [agreements, setAgreements] = useState<AgreementState>({
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [error, setError] = useState('');

  const canSubmit = email.trim() !== '' && agreements.terms && agreements.privacy;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    setError('');
    setEmail(email.trim().toLowerCase());
    setAgreedAt(new Date().toISOString());
    router.push('/signup/verify');
  };

  return (
    <div className="space-y-8">
      <div>
        <Serial current={1} total={3} label="EMAIL" className="block mb-4" />
        <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          회원가입
        </h2>
      </div>

      <form className="space-y-7" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label htmlFor="email" className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => { setEmailLocal(e.target.value); setError(''); }}
            autoComplete="email"
            className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
            placeholder="your@email.com"
          />
          {error && (
            <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]">
              {error}
            </p>
          )}
        </div>

        <AgreementCheckboxes value={agreements} onChange={setAgreements} />

        <Button type="submit" fullWidth size="lg" disabled={!canSubmit}>
          인증 메일 받기
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          이미 계정이 있으세요? 로그인 →
        </Link>
      </div>
    </div>
  );
}

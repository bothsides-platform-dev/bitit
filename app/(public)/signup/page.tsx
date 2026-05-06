'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Serial } from '@/components/primitives/Serial';
import { Button } from '@/components/primitives/Button';
import { AgreementCheckboxes } from '@/components/auth/AgreementCheckboxes';
import { useSignupDraftStore } from '@/lib/stores/signup-draft';
import { signupEmailAction } from '@/lib/server/actions/auth';
import {
  readSignupDraft,
  writeSignupDraft,
} from '@/lib/auth/signup-storage';

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
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim() !== '' && agreements.terms && agreements.privacy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    setError('');
    setSubmitting(true);

    const normalised = email.trim().toLowerCase();
    // sessionStorage carries inviteToken across reloads; the server action
    // reads it from the form input, the verify hop reads it from the verify
    // row's meta. See lib/server/actions/auth/signupEmailAction.ts.
    const draft = readSignupDraft();
    const inviteToken = draft.inviteToken;

    const r = await signupEmailAction({ email: normalised, inviteToken });
    setSubmitting(false);
    if (!r.ok) {
      setError('인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    writeSignupDraft({ ...draft, email: r.email });
    setEmail(r.email);
    setAgreedAt(new Date().toISOString());
    router.push(`/auth/verify?email=${encodeURIComponent(r.email)}`);
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

        <Button type="submit" fullWidth size="lg" disabled={!canSubmit || submitting}>
          {submitting ? 'LOADING…' : '인증 메일 받기'}
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

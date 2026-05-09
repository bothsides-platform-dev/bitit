'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/primitives/Button';
import { AgreementCheckboxes } from '@/components/auth/AgreementCheckboxes';
import { useSignupDraftStore } from '@/lib/stores/signup-draft';
import { signupEmailAction } from '@/lib/server/actions/auth';
import {
  readSignupDraft,
  writeSignupDraft,
} from '@/lib/auth/signup-storage';

type AgreementState = {
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
};

export default function PgSignupEmailPage() {
  const router = useRouter();
  const { setEmail, setAgreedAt, setWorkspaceType } = useSignupDraftStore();

  const [emailInput, setEmailInput] = useState('');
  const [agreements, setAgreements] = useState<AgreementState>({
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    emailInput.trim() !== '' &&
    agreements.terms &&
    agreements.privacy &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);

    const normalised = emailInput.trim().toLowerCase();
    const draft = readSignupDraft();
    const r = await signupEmailAction({
      email: normalised,
      workspaceType: 'pg',
      ...(draft.inviteToken ? { inviteToken: draft.inviteToken } : {}),
    });

    if (!r.ok) {
      setSubmitting(false);
      setError(r.error);
      return;
    }

    const agreedAt = new Date().toISOString();
    setEmail(normalised);
    setAgreedAt(agreedAt);
    setWorkspaceType('pg');

    writeSignupDraft({
      ...draft,
      email: normalised,
      agreedAt,
      workspaceType: 'pg',
    });

    router.push('/signup/pg/verify');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
          PG사 계정을 만듭니다
        </h2>
        <p className="mt-2 text-[13px] text-[var(--md-sys-color-on-surface-variant)]">
          초대 이메일을 받으셨다면 메일의 링크를 클릭하면 이 단계가 자동으로 건너뛰어집니다.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--md-sys-color-on-surface-variant)]"
          >
            이메일
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            autoComplete="email"
            placeholder="your@pgcompany.com"
            className="block w-full bg-transparent border-0 border-b border-[var(--md-sys-color-outline)] py-2 text-[14px] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-outline)] focus:outline-none focus:border-[var(--md-sys-color-on-surface)] transition-colors"
          />
        </div>

        <AgreementCheckboxes value={agreements} onChange={setAgreements} />

        {error === 'EMAIL_TAKEN' ? (
          <div role="alert" className="space-y-0.5">
            <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--md-sys-color-error)]">
              이미 가입된 이메일입니다.
            </p>
            <Link
              href={`/login?email=${encodeURIComponent(emailInput)}`}
              className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--md-sys-color-on-surface)] underline underline-offset-2 block"
            >
              → 로그인하기
            </Link>
          </div>
        ) : error ? (
          <p
            role="alert"
            className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--md-sys-color-error)]"
          >
            이메일을 보내지 못했습니다. 잠시 후 다시 시도해주세요.
          </p>
        ) : null}

        <Button type="submit" fullWidth size="lg" disabled={!canSubmit}>
          {submitting ? 'LOADING…' : '인증 메일 받기'}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <Link
          href="/signup"
          className="block font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
        >
          ← 역할 선택으로
        </Link>
        <Link
          href="/login"
          className="block font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
        >
          이미 계정이 있으세요? 로그인 →
        </Link>
      </div>

    </div>
  );
}

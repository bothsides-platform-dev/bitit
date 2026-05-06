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

type AgreementState = {
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
};

export default function BuyerSignupEmailPage() {
  const router = useRouter();
  const { setEmail, setAgreedAt, setWorkspaceType } = useSignupDraftStore();

  const [email, setEmailInput] = useState('');
  const [agreements, setAgreements] = useState<AgreementState>({
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    email.trim() !== '' &&
    agreements.terms &&
    agreements.privacy &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);

    const normalised = email.trim().toLowerCase();
    const r = await signupEmailAction({
      email: normalised,
      workspaceType: 'buyer',
    });

    if (!r.ok) {
      setSubmitting(false);
      setError('이메일을 보내지 못했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const agreedAt = new Date().toISOString();
    setEmail(normalised);
    setAgreedAt(agreedAt);
    setWorkspaceType('buyer');

    const draft = readSignupDraft();
    writeSignupDraft({
      ...draft,
      email: normalised,
      agreedAt,
      workspaceType: 'buyer',
    });

    router.push('/signup/buyer/verify');
  };

  return (
    <div className="space-y-8">
      <div>
        <Serial current={1} total={4} label="EMAIL" className="block mb-4" />
        <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          구매사 계정을 만듭니다
        </h2>
        <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
          구매사 워크스페이스용 이메일을 입력해주세요.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]"
          >
            이메일
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmailInput(e.target.value)}
            autoComplete="email"
            placeholder="your@company.com"
            className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
          />
        </div>

        <AgreementCheckboxes value={agreements} onChange={setAgreements} />

        {error && (
          <p
            role="alert"
            className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]"
          >
            {error}
          </p>
        )}

        <Button type="submit" fullWidth size="lg" disabled={!canSubmit}>
          {submitting ? 'LOADING…' : '인증 메일 받기'}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <Link
          href="/signup"
          className="block font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          ← 역할 선택으로
        </Link>
        <Link
          href="/login"
          className="block font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          이미 계정이 있으세요? 로그인 →
        </Link>
      </div>

      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-faint)] text-center">
        — FIN —
      </p>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Serial } from '@/components/primitives/Serial';
import { BuyerWorkspaceForm } from '@/components/auth/BuyerWorkspaceForm';
import { signupCompleteAction } from '@/lib/server/actions/auth';
import {
  clearSignupDraft,
  readSignupDraft,
  type SignupClientDraft,
} from '@/lib/auth/signup-storage';
import type { MerchantGrade } from '@/lib/types/biz-profile';

type BizProfilePayload = {
  bizNo: string;
  taxType: 'general' | 'simple' | 'exempt';
  status: 'active' | 'suspended' | 'closed';
  grade: MerchantGrade;
  gradeSource: 'user_confirmed';
};

export default function BuyerWorkspacePage() {
  const router = useRouter();
  const [draft, setDraft] = useState<SignupClientDraft | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    setDraft(readSignupDraft());
  }, []);

  const handleSubmit = useCallback(
    async (payload: { wsName: string; bizProfile?: BizProfilePayload }) => {
      const d = draft ?? readSignupDraft();
      if (!d.email || !d.password || !d.name) {
        setError('세션이 만료되었습니다. 처음부터 다시 시도해주세요.');
        return;
      }
      setSubmitting(true);
      setError('');

      const r = await signupCompleteAction({
        email: d.email,
        name: d.name,
        password: d.password,
        wsKind: 'buyer',
        wsName: payload.wsName,
        ...(payload.bizProfile ? { bizProfile: payload.bizProfile } : {}),
      });

      if (!r.ok) {
        setSubmitting(false);
        setError(`가입을 완료하지 못했습니다. (${r.error})`);
        return;
      }

      const signInResult = await signIn('credentials', {
        email: r.email,
        password: r.password,
        redirect: false,
      });

      clearSignupDraft();

      if (signInResult && signInResult.error) {
        setSubmitting(false);
        setError('로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.');
        router.push('/login');
        return;
      }

      router.push(r.redirectTo);
    },
    [draft, router],
  );

  // Guard: if draft isn't loaded yet, show LOADING…
  if (draft === null) {
    return (
      <p className="font-mono text-[12px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)] text-center">
        LOADING…
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Serial current={4} total={4} label="WORKSPACE" className="block mb-4" />
        <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          구매사 워크스페이스를 만듭니다
        </h2>
        <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
          회사명과 사업자 정보를 입력해주세요.
        </p>
      </div>

      <BuyerWorkspaceForm
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
      />
    </div>
  );
}

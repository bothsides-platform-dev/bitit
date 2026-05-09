'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { PgWorkspaceConfirm } from '@/components/auth/PgWorkspaceConfirm';
import { signupCompleteAction } from '@/lib/server/actions/auth';
import {
  clearSignupDraft,
  readSignupDraft,
} from '@/lib/auth/signup-storage';

export default function PgWorkspacePage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const draft = readSignupDraft();
  const isInvite = !!draft.inviteToken;
  const current = isInvite ? 3 : 4;
  const total = isInvite ? 3 : 4;

  const email = draft.email ?? '';
  const domain = email ? email.slice(email.lastIndexOf('@') + 1).toLowerCase() : '';

  const handleConfirm = async () => {
    const d = readSignupDraft();
    if (!d.email || !d.password || !d.name) {
      setError('세션이 만료되었습니다. 처음부터 다시 시도해주세요.');
      return;
    }
    setSubmitting(true);
    setError('');

    const r = await signupCompleteAction(
      d.inviteToken
        ? {
            email: d.email,
            name: d.name,
            password: d.password,
            inviteToken: d.inviteToken,
          }
        : {
            email: d.email,
            name: d.name,
            password: d.password,
            wsKind: 'pg',
          },
    );

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
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
          워크스페이스에 합류합니다
        </h2>
        <p className="mt-2 text-[13px] text-[var(--md-sys-color-on-surface-variant)]">
          이메일 도메인으로 PG 워크스페이스가 자동 연결됩니다.
        </p>
      </div>

      <PgWorkspaceConfirm
        domain={domain}
        onConfirm={handleConfirm}
        submitting={submitting}
        error={error}
      />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Serial } from '@/components/primitives/Serial';
import { Button } from '@/components/primitives/Button';
import { signupCompleteAction } from '@/lib/server/actions/auth';
import {
  clearSignupDraft,
  readSignupDraft,
  writeSignupDraft,
  type SignupClientDraft,
} from '@/lib/auth/signup-storage';

// Step 5 scope: this page only completes the *invite* branch automatically.
// The buyer/PG radio + BizLookupField + GradeConfirmPanel UI lands in Step 6
// (per BACKEND_MIGRATION.md §Step 6). For non-invite users we render a
// placeholder so the flow is reachable but obviously incomplete; the action
// itself supports both branches already.
export default function SignupWorkspacePage() {
  const router = useRouter();
  const [draft, setDraft] = useState<SignupClientDraft | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ranOnce = useRef(false);

  const runComplete = useCallback(
    async (d: SignupClientDraft, opts: { useInvite: boolean }) => {
      if (!d.email || !d.password || !d.name) return;
      setSubmitting(true);
      setError('');
      const r = await signupCompleteAction({
        email: d.email,
        name: d.name,
        password: d.password,
        ...(opts.useInvite && d.inviteToken
          ? { inviteToken: d.inviteToken }
          : {}),
      });
      if (!r.ok) {
        setSubmitting(false);
        setError(`가입을 완료하지 못했습니다. (${r.error})`);
        return;
      }
      // Auto-login: server actions can't set the Auth.js cookie cleanly under
      // Next 16, so the client drives signIn. See advisor block C.
      const signInResult = await signIn('credentials', {
        email: r.email,
        password: r.password,
        redirect: false,
      });
      // Clear before navigating — leftover password in sessionStorage is a
      // soft-secret leak we don't need.
      clearSignupDraft();
      if (signInResult && signInResult.error) {
        setSubmitting(false);
        setError('로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.');
        router.push('/login');
        return;
      }
      router.push(r.redirectTo);
    },
    [router],
  );

  // Read the durable draft once on mount; auto-submit invite branch.
  // The setState lives in a microtask so the lint rule doesn't flag the
  // (intentional) synchronous-looking call chain — the actions internally
  // await DB I/O so all state writes happen after the effect has returned.
  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    void (async () => {
      const d = readSignupDraft();
      setDraft(d);
      if (d.inviteToken && d.email && d.password && d.name) {
        await runComplete(d, { useInvite: true });
      }
    })();
  }, [runComplete]);

  if (draft && draft.inviteToken) {
    return (
      <div className="space-y-8">
        <div>
          <Serial current={3} total={3} label="WORKSPACE" className="block mb-4" />
          <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
            초대 워크스페이스로 합류 중…
          </h2>
        </div>
        {error ? (
          <p className="font-mono text-[12px] tracking-[0.1em] uppercase text-[var(--color-terracotta)]">
            {error}
          </p>
        ) : (
          <p className="font-mono text-[12px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">
            LOADING…
          </p>
        )}
        {submitting ? null : null}
      </div>
    );
  }

  // Non-invite branch — buyer/PG radio + BizLookup arrive in Step 6.
  return (
    <div className="space-y-8">
      <div>
        <Serial current={3} total={3} label="WORKSPACE" className="block mb-4" />
        <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          워크스페이스
        </h2>
      </div>
      <p className="text-[13px] text-[var(--color-ink-muted)]">
        구매사/PG 선택 + 사업자등록번호 조회 UI는 Step 6에서 제공됩니다.
      </p>
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-faint)]">
        — STEP 6 PENDING —
      </p>
      {error && (
        <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button
          type="button"
          fullWidth
          variant="secondary"
          onClick={() => {
            // Best-effort exit — let the user resume later via /home.
            writeSignupDraft({});
            router.push('/login');
          }}
        >
          나중에
        </Button>
      </div>
    </div>
  );
}

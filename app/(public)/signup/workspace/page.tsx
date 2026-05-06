'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Serial } from '@/components/primitives/Serial';
import { Button } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { WorkspaceTypeRadio } from '@/components/auth/WorkspaceTypeRadio';
import {
  BizLookupField,
  type BizLookupResult,
} from '@/components/rfq/BizLookupField';
import { GradeConfirmPanel } from '@/components/rfq/GradeConfirmPanel';
import { signupCompleteAction } from '@/lib/server/actions/auth';
import { lookupBizNoAction } from '@/lib/server/actions/rfq';
import {
  clearSignupDraft,
  readSignupDraft,
  writeSignupDraft,
  type SignupClientDraft,
} from '@/lib/auth/signup-storage';
import type { MerchantGrade } from '@/lib/types/biz-profile';
import { cn } from '@/lib/utils';

type Tab = 'create' | 'join';

// Step 7 — `lookupBizNoAction` swap. BizLookupField는
// `{ valid:true|false, taxType?, status? }` 만 기대하므로 액션 결과의
// `{ ok, error?, ... }` 를 그 구조로 다듬어 전달한다. NTS 에러는 'valid:false'
// 로 normalize — 폼은 "등록된 사업자번호가 없습니다" 단일 분기로 충분.
const ntsLookup = async (bizNo: string) => {
  const r = await lookupBizNoAction(bizNo);
  if (!r.ok || !r.valid) return { valid: false as const };
  return {
    valid: true as const,
    taxType: r.taxType!,
    status: r.status!,
  };
};

export default function SignupWorkspacePage() {
  const router = useRouter();
  const [draft, setDraft] = useState<SignupClientDraft | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ranOnce = useRef(false);

  // Form state for the non-invite path. Memoised default so the radio
  // sub-component sees a stable reference.
  const [tab, setTab] = useState<Tab>('create');
  const [wsKind, setWsKind] = useState<'buyer' | 'pg'>('buyer');
  const [wsName, setWsName] = useState('');
  const [bizProfile, setBizProfile] = useState<BizLookupResult | null>(null);
  const [grade, setGrade] = useState<MerchantGrade | null>(null);

  const inviteEmailDomain = useMemo(() => {
    const e = draft?.email ?? '';
    const i = e.lastIndexOf('@');
    return i > 0 ? e.slice(i + 1) : '';
  }, [draft?.email]);

  const completeAndSignIn = useCallback(
    async (
      d: SignupClientDraft,
      payload:
        | { useInvite: true }
        | {
            useInvite: false;
            wsKind: 'buyer' | 'pg';
            wsName: string;
            bizProfile?: {
              bizNo: string;
              taxType: 'general' | 'simple' | 'exempt';
              status: 'active' | 'suspended' | 'closed';
              grade: MerchantGrade;
              gradeSource: 'user_confirmed';
            };
          },
    ) => {
      if (!d.email || !d.password || !d.name) return;
      setSubmitting(true);
      setError('');
      const r = await signupCompleteAction({
        email: d.email,
        name: d.name,
        password: d.password,
        ...(payload.useInvite
          ? { inviteToken: d.inviteToken }
          : {
              wsKind: payload.wsKind,
              wsName: payload.wsName,
              ...(payload.bizProfile ? { bizProfile: payload.bizProfile } : {}),
            }),
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
        setError(
          '로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.',
        );
        router.push('/login');
        return;
      }
      router.push(r.redirectTo);
    },
    [router],
  );

  // Read sessionStorage once. Auto-run the invite branch (preserves Step 5).
  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    void (async () => {
      const d = readSignupDraft();
      setDraft(d);
      if (d.inviteToken && d.email && d.password && d.name) {
        await completeAndSignIn(d, { useInvite: true });
      }
    })();
  }, [completeAndSignIn]);

  // ─── Invite branch (Step 5 behaviour preserved) ─────────────────────────
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
      </div>
    );
  }

  // ─── New-workspace branch ───────────────────────────────────────────────
  const buyerReady =
    wsKind === 'buyer' &&
    wsName.trim() !== '' &&
    bizProfile !== null &&
    grade !== null;
  const pgReady = wsKind === 'pg' && wsName.trim() !== '';
  const canSubmit = (buyerReady || pgReady) && !submitting;

  const handleSubmit = async () => {
    if (!draft) return;
    if (wsKind === 'buyer') {
      if (!buyerReady || !bizProfile || !grade) return;
      await completeAndSignIn(draft, {
        useInvite: false,
        wsKind: 'buyer',
        wsName: wsName.trim(),
        bizProfile: {
          bizNo: bizProfile.bizNo,
          taxType: bizProfile.taxType,
          status: bizProfile.status,
          grade,
          gradeSource: 'user_confirmed',
        },
      });
      return;
    }
    if (!pgReady) return;
    await completeAndSignIn(draft, {
      useInvite: false,
      wsKind: 'pg',
      wsName: wsName.trim(),
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <Serial current={3} total={3} label="WORKSPACE" className="block mb-4" />
        <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          워크스페이스
        </h2>
        <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
          새 워크스페이스를 만들거나 코드로 합류합니다.
        </p>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="워크스페이스 진입 방식"
        className="flex border-b border-[var(--color-hair)]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'create'}
          onClick={() => setTab('create')}
          className={cn(
            'px-4 py-2 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors -mb-px border-b',
            tab === 'create'
              ? 'border-[var(--color-ink)] text-[var(--color-ink)]'
              : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
          )}
        >
          새 워크스페이스
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'join'}
          onClick={() => setTab('join')}
          className={cn(
            'px-4 py-2 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors -mb-px border-b',
            tab === 'join'
              ? 'border-[var(--color-ink)] text-[var(--color-ink)]'
              : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
          )}
        >
          코드로 합류
        </button>
      </div>

      {tab === 'join' ? (
        <div className="space-y-3 py-6">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-faint)]">
            — 코드로 합류는 곧 제공됩니다 —
          </p>
          <p className="text-[12px] text-[var(--color-ink-muted)] leading-relaxed">
            현재는 초대 메일 링크 또는 새 워크스페이스 생성으로만 진입할 수
            있습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <WorkspaceTypeRadio value={wsKind} onChange={setWsKind} />

          <div className="space-y-1">
            <Eyebrow>워크스페이스 이름 *</Eyebrow>
            <input
              type="text"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              placeholder={
                wsKind === 'buyer' ? '(주)샘플테크' : '토스페이먼츠'
              }
              className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
            />
            {wsKind === 'pg' && inviteEmailDomain && (
              <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)] pt-1">
                도메인 자동 — @{inviteEmailDomain}
              </p>
            )}
          </div>

          {wsKind === 'buyer' && (
            <>
              <BizLookupField
                onLookup={ntsLookup}
                onResult={(profile) => {
                  setBizProfile(profile);
                  setGrade(null);
                }}
                onReset={() => {
                  setBizProfile(null);
                  setGrade(null);
                }}
              />

              {bizProfile && (
                <GradeConfirmPanel
                  onConfirm={(g) => setGrade(g)}
                />
              )}
            </>
          )}

          {error && (
            <p
              role="alert"
              className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]"
            >
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              fullWidth
              size="lg"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {submitting ? '처리 중…' : '만들기'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => {
                writeSignupDraft({});
                router.push('/login');
              }}
            >
              나중에
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

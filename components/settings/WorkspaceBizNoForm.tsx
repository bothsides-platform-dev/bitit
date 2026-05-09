'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { Label } from '@/components/primitives/Label';
import {
  BizLookupField,
  type BizLookupResult,
} from '@/components/rfq/BizLookupField';
import {
  lookupBizNoAction,
  updateWorkspaceBizProfileAction,
} from '@/lib/server/actions/rfq';

const ntsLookup = async (bizNo: string) => {
  const r = await lookupBizNoAction(bizNo);
  if (!r.ok || !r.valid) return { valid: false as const };
  return {
    valid: true as const,
    taxType: r.taxType!,
    status: r.status!,
  };
};

type Props = {
  /** null = 사업자번호 미등록 (초기 등록 모드로 진입) */
  currentBizNo: string | null;
  /** 초기 등록 성공 후 이동할 URL (biz_required 흐름에서 /rfq/new 등) */
  returnUrl?: string;
};

export function WorkspaceBizNoForm({ currentBizNo, returnUrl }: Props) {
  // 미등록 상태(null)에서는 곧장 입력 UI 노출 — 별도 '수정' 버튼이 없으므로
  // 디폴트 editing=true.
  const [editing, setEditing] = useState(currentBizNo === null);
  const [next, setNext] = useState<BizLookupResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const dirty = next !== null && next.bizNo !== currentBizNo;

  const handleStartEdit = () => {
    setEditing(true);
    setError('');
    setSavedAt(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setNext(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!dirty || submitting || !next) return;
    setSubmitting(true);
    setError('');
    const r = await updateWorkspaceBizProfileAction({
      bizProfile: {
        bizNo: next.bizNo,
        taxType: next.taxType,
        status: next.status,
      },
    });
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setSavedAt(new Date().toLocaleTimeString('ko-KR'));
    setEditing(false);
    setNext(null);
    if (isInitialRegistration && returnUrl) {
      startTransition(() => router.push(returnUrl));
    } else {
      startTransition(() => router.refresh());
    }
  };

  const isInitialRegistration = currentBizNo === null;

  return (
    <div className="space-y-4">
      <Label size="md" muted={false}>사업자 등록번호</Label>
      {!editing && currentBizNo !== null ? (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-y border-[var(--color-hair)] py-2.5">
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">
            현재
          </span>
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            <span className="text-[13px] text-[var(--color-ink)] font-mono tabular-nums">
              {currentBizNo}
            </span>
            <button
              type="button"
              onClick={handleStartEdit}
              className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors shrink-0"
            >
              수정
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <BizLookupField
            onLookup={ntsLookup}
            onResult={(profile) => setNext(profile)}
            onReset={() => setNext(null)}
          />

          {next && next.bizNo === currentBizNo && (
            <p
              role="status"
              className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-ink-muted)]"
            >
              현재 사업자번호와 동일합니다.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]"
            >
              저장 실패 — {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              disabled={!dirty || submitting}
              onClick={handleSubmit}
            >
              {submitting
                ? '저장 중…'
                : isInitialRegistration
                  ? '사업자번호 등록'
                  : '변경 적용'}
            </Button>
            {!isInitialRegistration && (
              <button
                type="button"
                onClick={handleCancel}
                className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
              >
                취소
              </button>
            )}
          </div>
        </div>
      )}

      {savedAt && !editing && (
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-moss)]">
          ✓ 저장됨 {savedAt}
        </span>
      )}


    </div>
  );
}

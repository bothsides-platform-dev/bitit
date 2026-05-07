'use client';

import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Tag } from '@/components/primitives/Tag';
import { GRADE_LABELS, type MerchantGrade } from '@/lib/types/biz-profile';

type Source = 'user_confirmed' | 'user_overridden';

type Props = {
  /** Self-declared grade selection. Source is always `user_confirmed` in v0
   *  (Step 6) — `user_overridden` is reserved for the post-NICE flow that
   *  Step 7+ may reintroduce. */
  onConfirm: (grade: MerchantGrade, source: Source) => void;
};

const ALL_GRADES: MerchantGrade[] = ['small', 'sme1', 'sme2', 'sme3', 'general'];

// Statutory revenue brackets (annual, 카드 가맹점 우대수수료 기준).
// Used as plain helper text — not a hard validator.
const REVENUE_HINT: Record<MerchantGrade, string> = {
  small: '연매출 3억 원 이하',
  sme1: '연매출 3억 ~ 5억 원',
  sme2: '연매출 5억 ~ 10억 원',
  sme3: '연매출 10억 ~ 30억 원',
  general: '연매출 30억 원 초과',
};

export function GradeConfirmPanel({ onConfirm }: Props) {
  const [grade, setGrade] = useState<MerchantGrade>('sme1');
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <div className="flex items-center gap-3 py-2">
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">
          등급 확정
        </span>
        <Tag variant="default">{GRADE_LABELS[grade]}</Tag>
        <button
          type="button"
          onClick={() => setConfirmed(false)}
          className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)] transition-colors ml-auto"
        >
          수정
        </button>
      </div>
    );
  }

  return (
    <fieldset className="space-y-3" data-testid="grade-confirm-panel">
      <legend className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)] mb-1">
        가맹점 등급 (자기신고)
      </legend>
      <div className="border border-[var(--color-hair)] divide-y divide-[var(--color-hair)]">
        {ALL_GRADES.map((g) => {
          const selected = grade === g;
          return (
            <label
              key={g}
              htmlFor={`grade-${g}`}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[var(--color-paper-warm)] transition-colors"
            >
              <input
                id={`grade-${g}`}
                type="radio"
                name="merchant-grade"
                value={g}
                checked={selected}
                onChange={() => setGrade(g)}
                className="w-3.5 h-3.5 accent-[var(--color-ink)]"
              />
              <span className="text-[13px] text-[var(--color-ink)] font-medium min-w-[3rem]">
                {GRADE_LABELS[g]}
              </span>
              <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-soft)] flex-1">
                {REVENUE_HINT[g]}
              </span>
            </label>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
          영세·중소 카드료는 법정 고정 — 일반은 카드사별 협상.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setConfirmed(true);
            onConfirm(grade, 'user_confirmed');
          }}
        >
          확인
        </Button>
      </div>
    </fieldset>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { updateWorkspaceBizProfileAction } from '@/lib/server/actions/rfq';
import { STATUTORY_CARD_FEE } from '@/lib/types/bid';
import { GRADE_LABELS, type MerchantGrade } from '@/lib/types/biz-profile';

const ALL_GRADES: MerchantGrade[] = [
  'small',
  'sme1',
  'sme2',
  'sme3',
  'general',
];

function formatCardFee(grade: MerchantGrade): string {
  const fee = STATUTORY_CARD_FEE[grade];
  if (Number.isNaN(fee)) return '협상';
  return `${(fee * 100).toFixed(2)}%`;
}

type Props = {
  currentGrade: MerchantGrade | undefined;
};

export function WorkspaceBizProfileForm({ currentGrade }: Props) {
  const [grade, setGrade] = useState<MerchantGrade>(
    currentGrade ?? 'sme2',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const dirty = grade !== currentGrade;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || submitting) return;
    setSubmitting(true);
    setError('');
    const r = await updateWorkspaceBizProfileAction({ grade });
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setSavedAt(new Date().toLocaleTimeString('ko-KR'));
    startTransition(() => router.refresh());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Eyebrow>가맹점 등급 갱신</Eyebrow>
      <div className="border border-[var(--color-hair)] divide-y divide-[var(--color-hair)]">
        {ALL_GRADES.map((g) => {
          const selected = grade === g;
          return (
            <label
              key={g}
              htmlFor={`ws-grade-${g}`}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[var(--color-paper-warm)] transition-colors"
            >
              <input
                id={`ws-grade-${g}`}
                type="radio"
                name="ws-merchant-grade"
                value={g}
                checked={selected}
                onChange={() => setGrade(g)}
                className="w-3.5 h-3.5 accent-[var(--color-ink)]"
              />
              <span className="text-[13px] text-[var(--color-ink)] font-medium min-w-[3rem]">
                {GRADE_LABELS[g]}
              </span>
              <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink)] ml-auto">
                카드 {formatCardFee(g)}
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]"
        >
          저장 실패 — {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!dirty || submitting}>
          {submitting ? '저장 중…' : '등급 갱신'}
        </Button>
        {savedAt && (
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-moss)]">
            ✓ 저장됨 {savedAt}
          </span>
        )}
      </div>
      <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
        새 등급은 새로운 사업자 프로필 row로 저장되며 워크스페이스에 반영됩니다.
        과거 RFQ는 발송 시점 스냅샷을 그대로 유지합니다.
      </p>
    </form>
  );
}

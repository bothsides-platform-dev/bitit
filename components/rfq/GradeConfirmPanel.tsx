'use client';

import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Tag } from '@/components/primitives/Tag';
import { lookupNiceGrade, GRADE_LABELS } from '@/lib/mock/biz-lookup';
import { STATUTORY_CARD_FEE } from '@/lib/types/bid';
import type { MerchantGrade } from '@/lib/types/biz-profile';

type GradeResult = {
  grade: MerchantGrade;
  gradeSource: 'user_confirmed' | 'user_overridden';
  estimatedRevenue?: number;
  revenueYear?: string;
};

type Props = {
  bizNo: string;
  onConfirm: (result: GradeResult) => void;
};

const ALL_GRADES: MerchantGrade[] = ['small', 'sme1', 'sme2', 'sme3', 'general'];

function formatRevenue(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  return n.toLocaleString('ko-KR');
}

function formatCardFee(grade: MerchantGrade): string {
  const fee = STATUTORY_CARD_FEE[grade];
  if (isNaN(fee)) return '카드사별 협의';
  return `${(fee * 100).toFixed(2)}%`;
}

export function GradeConfirmPanel({ bizNo, onConfirm }: Props) {
  const [consented, setConsented] = useState(false);
  const [niceStatus, setNiceStatus] = useState<'idle' | 'loading' | 'done' | 'fail'>('idle');
  const [niceGrade, setNiceGrade] = useState<MerchantGrade | null>(null);
  const [niceRevenue, setNiceRevenue] = useState<number | null>(null);
  const [niceYear, setNiceYear] = useState<string | null>(null);
  const [override, setOverride] = useState(false);
  const [overrideGrade, setOverrideGrade] = useState<MerchantGrade>('sme1');
  const [confirmed, setConfirmed] = useState(false);

  const handleConsent = async (checked: boolean) => {
    setConsented(checked);
    if (!checked) return;
    setNiceStatus('loading');
    const result = await lookupNiceGrade(bizNo);
    if (result) {
      setNiceGrade(result.grade);
      setNiceRevenue(result.estimatedRevenue);
      setNiceYear(result.revenueYear);
      setNiceStatus('done');
    } else {
      setNiceStatus('fail');
    }
  };

  const handleConfirm = (grade: MerchantGrade, source: GradeResult['gradeSource']) => {
    setConfirmed(true);
    onConfirm({
      grade,
      gradeSource: source,
      estimatedRevenue: niceRevenue ?? undefined,
      revenueYear: niceYear ?? undefined,
    });
  };

  if (confirmed) {
    const finalGrade = override ? overrideGrade : (niceGrade ?? overrideGrade);
    return (
      <div className="flex items-center gap-3 py-2">
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">등급 확정</span>
        <Tag variant="default">{GRADE_LABELS[finalGrade]}</Tag>
        <span className="font-mono text-[11px] text-[var(--color-ink-soft)] tabular-nums">
          카드 {formatCardFee(finalGrade)}
        </span>
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
    <div className="space-y-4">
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => handleConsent(e.target.checked)}
          className="mt-0.5 w-3.5 h-3.5 accent-[var(--color-ink)] shrink-0"
        />
        <span className="text-[13px] text-[var(--color-ink-muted)] leading-snug">
          NICE 신용정보 조회 동의{' '}
          <span className="font-mono text-[11px] text-[var(--color-ink-soft)]">(선택 — 추정 연매출·등급 자동 조회)</span>
        </span>
      </label>

      {consented && (
        <>
          {niceStatus === 'loading' && (
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">
              NICE — 조회 중…
            </p>
          )}

          {niceStatus === 'fail' && (
            <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]">
              NICE 데이터를 찾지 못했습니다. 직접 입력하세요.
            </p>
          )}

          {niceStatus === 'done' && niceGrade && !override && (
            <div className="border border-[var(--color-hair)] divide-y divide-[var(--color-hair)]">
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">NICE — 추정 등급</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Tag>{GRADE_LABELS[niceGrade]}</Tag>
                    <span className="font-mono text-[11px] text-[var(--color-ink-soft)] tabular-nums">
                      카드 {formatCardFee(niceGrade)}
                    </span>
                  </div>
                  {niceRevenue && (
                    <p className="font-mono text-[11px] tabular-nums text-[var(--color-ink-soft)]">
                      추정 연매출 {formatRevenue(niceRevenue)} ({niceYear})
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOverride(true)}
                    className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                  >
                    수정
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleConfirm(niceGrade, 'user_confirmed')}
                  >
                    맞습니다
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {(niceStatus === 'fail' || override || !consented) && (
        <div className="space-y-1">
          <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
            등급 직접 선택
          </span>
          <div className="flex items-center gap-3">
            <select
              value={overrideGrade}
              onChange={(e) => setOverrideGrade(e.target.value as MerchantGrade)}
              className="flex-1 bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
            >
              {ALL_GRADES.map((g) => (
                <option key={g} value={g}>
                  {GRADE_LABELS[g]} — 카드 {formatCardFee(g)}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              onClick={() => handleConfirm(overrideGrade, override ? 'user_overridden' : 'user_confirmed')}
            >
              확인
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

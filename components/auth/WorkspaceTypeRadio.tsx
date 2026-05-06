'use client';

import { cn } from '@/lib/utils';

export type WorkspaceTypeValue = 'buyer' | 'pg';

type Props = {
  value: WorkspaceTypeValue;
  onChange: (v: WorkspaceTypeValue) => void;
};

type Option = {
  value: WorkspaceTypeValue;
  label: string;
  meta: string;
  bracket: string;
};

const OPTIONS: Option[] = [
  {
    value: 'buyer',
    label: '구매사',
    meta: '결제 인프라를 도입하는 사업자입니다.',
    bracket: 'BUYER',
  },
  {
    value: 'pg',
    label: '결제대행사 (PG)',
    meta: '구매사 견적 요청에 응답하는 영업담당입니다.',
    bracket: 'PG',
  },
];

export function WorkspaceTypeRadio({ value, onChange }: Props) {
  return (
    <fieldset
      className="space-y-2"
      data-testid="workspace-type-radio"
    >
      <legend className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)] mb-2">
        워크스페이스 유형
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              htmlFor={`ws-kind-${opt.value}`}
              className={cn(
                'group relative cursor-pointer block px-4 py-3 border transition-colors rounded-[5px]',
                selected
                  ? 'border-[var(--color-ink)] bg-[var(--color-paper-warm)]'
                  : 'border-[var(--color-hair)] hover:border-[var(--color-hair-strong)]',
              )}
            >
              <input
                id={`ws-kind-${opt.value}`}
                type="radio"
                name="ws-kind"
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[14px] font-medium text-[var(--color-ink)]">
                  {opt.label}
                </span>
                <span
                  className={cn(
                    'font-mono text-[10px] tracking-[0.14em] uppercase',
                    selected
                      ? 'text-[var(--color-ink)]'
                      : 'text-[var(--color-ink-faint)]',
                  )}
                  aria-hidden
                >
                  <span className="opacity-50">[ </span>
                  {selected ? '선택됨' : opt.bracket}
                  <span className="opacity-50"> ]</span>
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[var(--color-ink-muted)] leading-snug">
                {opt.meta}
              </p>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

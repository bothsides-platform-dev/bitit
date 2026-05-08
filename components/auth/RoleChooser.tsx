'use client';

import { cn } from '@/lib/utils';

type Role = 'buyer' | 'pg';

type Option = {
  role: Role;
  title: string;
  description: string;
  badge: string;
};

const OPTIONS: Option[] = [
  {
    role: 'buyer',
    title: '구매사',
    description: '결제대행사에 견적을 요청하는 사업자입니다.',
    badge: 'BUYER',
  },
  {
    role: 'pg',
    title: 'PG사 영업담당',
    description: '구매사 RFQ를 받아 견적을 제출하는 영업담당입니다.',
    badge: 'PG',
  },
];

type Props = {
  onSelect: (role: Role) => void;
};

export function RoleChooser({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {OPTIONS.map((opt) => (
        <button
          key={opt.role}
          type="button"
          onClick={() => onSelect(opt.role)}
          className={cn(
            'group relative text-left px-5 py-5 border border-[var(--color-hair)]',
            'hover:border-[var(--color-ink)] transition-colors rounded-md',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ink)]',
          )}
        >
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <span className="text-[15px] font-[600] text-[var(--color-ink)]">
              {opt.title}
            </span>
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-ink-faint)]">
              <span className="opacity-50">[ </span>
              {opt.badge}
              <span className="opacity-50"> ]</span>
            </span>
          </div>
          <p className="text-[12px] text-[var(--color-ink-muted)] leading-snug">
            {opt.description}
          </p>
        </button>
      ))}
    </div>
  );
}

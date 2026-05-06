'use client';

import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { lookupBizNo, KSIC_LABELS } from '@/lib/mock/biz-lookup';
import { cn } from '@/lib/utils';

// Local mock NTS record shape (kept separate from the slim BizProfile DB type).
// Step 13 deletes this component along with the rest of the mock surface.
type BaseProfile = {
  bizNo: string;
  name: string;
  ceoName: string;
  ksic: string;
  taxType: 'general' | 'simple' | 'exempt';
  status: 'active' | 'suspended' | 'closed';
  mailOrderNo?: string;
};

type Status = 'idle' | 'loading' | 'found' | 'notfound';

type Props = {
  onFound: (profile: BaseProfile) => void;
  onReset: () => void;
};

function formatBizNo(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

const TAX_TYPE_LABEL: Record<string, string> = {
  general: '일반과세',
  simple: '간이과세',
  exempt: '면세',
};

const STATUS_LABEL: Record<string, string> = {
  active: '정상',
  suspended: '휴업',
  closed: '폐업',
};

export function BizLookupField({ onFound, onReset }: Props) {
  const [raw, setRaw] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<BaseProfile | null>(null);
  const [error, setError] = useState('');

  const formatted = formatBizNo(raw);
  const isComplete = formatted.replace(/-/g, '').length === 10;

  const handleLookup = async () => {
    if (!isComplete) return;
    setStatus('loading');
    setError('');
    const found = await lookupBizNo(formatted);
    if (found) {
      setResult(found);
      setStatus('found');
      onFound(found);
    } else {
      setResult(null);
      setStatus('notfound');
      setError('등록된 사업자번호가 없습니다.');
    }
  };

  const handleReset = () => {
    setRaw('');
    setStatus('idle');
    setResult(null);
    setError('');
    onReset();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Eyebrow>사업자 등록번호</Eyebrow>
        <div className="flex items-end gap-3">
          <input
            type="text"
            value={formatted}
            onChange={(e) => {
              setRaw(e.target.value);
              if (status !== 'idle') { setStatus('idle'); setResult(null); onReset(); }
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            disabled={status === 'found'}
            placeholder="000-00-00000"
            className={cn(
              'flex-1 bg-transparent border-0 border-b py-2 text-[14px] font-mono tabular-nums text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none transition-colors',
              status === 'found'
                ? 'border-[var(--color-ink)] opacity-60'
                : 'border-[var(--color-hair-strong)] focus:border-[var(--color-ink)]',
            )}
          />
          {status === 'found' ? (
            <button
              type="button"
              onClick={handleReset}
              className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-terracotta)] transition-colors pb-2"
            >
              초기화
            </button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!isComplete || status === 'loading'}
              onClick={handleLookup}
            >
              {status === 'loading' ? '조회 중…' : '조회'}
            </Button>
          )}
        </div>
        {error && (
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]">
            {error}
          </p>
        )}
      </div>

      {status === 'found' && result && (
        <div className="border border-[var(--color-hair)] divide-y divide-[var(--color-hair)]">
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">NTS — 국세청 자동 조회</span>
            <span className="font-mono text-[10px] tracking-[0.1em] text-[var(--color-moss)]">✓ 확인됨</span>
          </div>
          {[
            ['상호명', result.name],
            ['대표자', result.ceoName],
            ['업종', KSIC_LABELS[result.ksic] ?? result.ksic],
            ['과세 유형', TAX_TYPE_LABEL[result.taxType]],
            ['사업자 상태', STATUS_LABEL[result.status]],
            ...(result.mailOrderNo ? [['통신판매업', result.mailOrderNo]] : []),
          ].map(([label, value]) => (
            <div key={label} className="px-4 py-2.5 flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">{label}</span>
              <span className="text-[13px] text-[var(--color-ink)] font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

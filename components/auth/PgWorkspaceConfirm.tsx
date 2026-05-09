'use client';

import { Button } from '@/components/primitives/Button';

type Props = {
  domain: string;
  onConfirm: () => Promise<void>;
  submitting: boolean;
  error?: string;
};

export function PgWorkspaceConfirm({ domain, onConfirm, submitting, error }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-4 border border-[var(--md-sys-color-outline)] p-6 rounded-md">
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--md-sys-color-on-surface-variant)]">
          자동 합류 워크스페이스
        </p>

        <p className="font-mono text-[22px] tabular-nums text-[var(--md-sys-color-on-surface)] tracking-[-0.01em]">
          @{domain}
        </p>

        <p className="text-[13px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
          이메일 도메인을 기반으로 PG 워크스페이스에 자동으로 합류합니다.
          동일 도메인의 동료와 같은 워크스페이스를 공유합니다.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--md-sys-color-error)]"
        >
          {error}
        </p>
      )}

      <Button
        type="button"
        fullWidth
        size="lg"
        disabled={submitting}
        onClick={onConfirm}
      >
        {submitting ? '처리 중…' : '합류하기'}
      </Button>
    </div>
  );
}

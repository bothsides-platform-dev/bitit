'use client';

import { Serial } from '@/components/primitives/Serial';
import { ResendCountdown } from '@/components/auth/ResendCountdown';
import { EnvelopeSvg } from '@/components/auth/EnvelopeSvg';
import { useSignupDraftStore } from '@/lib/stores/signup-draft';
import Link from 'next/link';

export default function SignupVerifyPage() {
  const { email } = useSignupDraftStore();
  const displayEmail = email || 'your@email.com';

  return (
    <div className="space-y-8 text-center">
      <Serial current={1} total={3} label="VERIFY" className="inline-block mb-4" />
      <div className="flex justify-center text-[var(--color-ink-faint)]">
        <EnvelopeSvg size={80} />
      </div>
      <div className="space-y-3">
        <h2 className="text-[20px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">인증 메일을 보냈습니다</h2>
        <p className="text-[13px] text-[var(--color-ink-muted)]">
          <span className="font-mono tabular-nums">{displayEmail}</span>
        </p>
        <p className="text-[13px] text-[var(--color-ink-muted)]">
          메일의 [인증하기] 버튼을 눌러주세요.<br />
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">5분 내 만료됩니다.</span>
        </p>
      </div>
      <div className="space-y-3">
        <ResendCountdown onResend={() => {}} />
        <Link href="/signup" className="block font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
          다른 이메일로 변경
        </Link>
      </div>
      <div className="text-[12px] text-[var(--color-ink-soft)] space-y-1">
        <p>스팸함을 확인해보세요.</p>
        <p>회사 메일의 경우 도메인 차단 여부를 확인해주세요.</p>
      </div>
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-faint)]">— FIN —</p>
    </div>
  );
}

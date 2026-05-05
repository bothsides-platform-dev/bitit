'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Serial } from '@/components/primitives/Serial';
import { Button } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { cn } from '@/lib/utils';

type Tab = 'create' | 'join';

export default function SignupWorkspacePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('create');
  const [wsName, setWsName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  return (
    <div className="space-y-8">
      <div>
        <Serial current={3} total={3} label="WORKSPACE" className="block mb-4" />
        <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">워크스페이스</h2>
      </div>
      <div className="flex border-b border-[var(--color-hair)]">
        {(['create', 'join'] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={cn('flex-1 py-3 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors relative',
              tab === t ? 'text-[var(--color-ink)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-[var(--color-ink)]'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]')}>
            {t === 'create' ? '새로 만들기' : '코드로 합류'}
          </button>
        ))}
      </div>
      {tab === 'create' ? (
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); router.push('/home'); }}>
          <div className="space-y-1">
            <Eyebrow>워크스페이스 이름</Eyebrow>
            <input type="text" value={wsName} onChange={(e) => setWsName(e.target.value)}
              className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
              placeholder="(주)샘플테크" />
          </div>
          <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">견적 번호 형식: Q-{'{YY}{MM}'}-{'{####}'}</p>
          <Button type="submit" fullWidth size="lg" disabled={!wsName.trim()}>만들기</Button>
        </form>
      ) : (
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); router.push('/home'); }}>
          <div className="space-y-1">
            <Eyebrow>초대 코드</Eyebrow>
            <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
              className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] font-mono tabular-nums text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
              placeholder="XXXX-XXXX" />
          </div>
          <Button type="submit" fullWidth size="lg" disabled={!inviteCode.trim()}>합류하기</Button>
        </form>
      )}
      <button type="button" onClick={() => router.push('/home')}
        className="block w-full text-center font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)] hover:text-[var(--color-ink-soft)] transition-colors">
        나중에 만들기
      </button>
    </div>
  );
}

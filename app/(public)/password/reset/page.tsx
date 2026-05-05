'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Serial } from '@/components/primitives/Serial';
import { Button } from '@/components/primitives/Button';
import { PasswordField } from '@/components/auth/PasswordField';
import { CheckSvg } from '@/components/auth/EnvelopeSvg';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
    setDone(true);
    setTimeout(() => router.push('/home'), 1500);
  };

  if (done) {
    return (
      <div className="space-y-8 text-center">
        <div className="flex justify-center text-[var(--color-moss)]"><CheckSvg size={64} /></div>
        <p className="text-[14px] text-[var(--color-ink)]">비밀번호가 변경되었습니다.</p>
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">LOADING…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Serial current={2} total={2} label="RESET" className="block mb-4" />
        <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">새 비밀번호</h2>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <PasswordField label="새 비밀번호" value={password} onChange={setPassword} showStrength />
        <PasswordField label="비밀번호 확인" name="passwordConfirm" value={passwordConfirm} onChange={setPasswordConfirm} autoComplete="new-password" error={error} />
        <Button type="submit" fullWidth size="lg">변경하기</Button>
      </form>
    </div>
  );
}

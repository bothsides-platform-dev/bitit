'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Serial } from '@/components/primitives/Serial';
import { Button } from '@/components/primitives/Button';
import { PasswordField } from '@/components/auth/PasswordField';
import { useSignupDraftStore } from '@/lib/stores/signup-draft';

export default function SignupProfilePage() {
  const router = useRouter();
  const { setProfile } = useSignupDraftStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = '이름을 입력해주세요.';
    if (password.length < 10) errs.password = 'MIN 10';
    else if (!/[A-Za-z]/.test(password)) errs.password = 'A-Z 1+';
    else if (!/\d/.test(password)) errs.password = '0-9 1+';
    else if (!/[^A-Za-z0-9]/.test(password)) errs.password = '!@# 1+';
    if (password !== passwordConfirm) errs.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setProfile(name.trim(), phone.trim() || undefined);
    router.push('/signup/workspace');
  };

  return (
    <div className="space-y-8">
      <div>
        <Serial current={2} total={3} label="PROFILE" className="block mb-4" />
        <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">프로필 설정</h2>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label htmlFor="name" className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">이름</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
            className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors" />
          {errors.name && <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]">{errors.name}</p>}
        </div>
        <PasswordField label="비밀번호" value={password} onChange={setPassword} showStrength error={errors.password} />
        <PasswordField label="비밀번호 확인" name="passwordConfirm" value={passwordConfirm} onChange={setPasswordConfirm} autoComplete="new-password" error={errors.passwordConfirm} />
        <div className="space-y-1">
          <label htmlFor="phone" className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">휴대전화 <span className="opacity-50">(선택)</span></label>
          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="010-0000-0000"
            className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] font-mono tabular-nums text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors" />
        </div>
        <Button type="submit" fullWidth size="lg">다음</Button>
      </form>
    </div>
  );
}

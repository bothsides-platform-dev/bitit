'use client';

import { useState } from 'react';
import { passwordStrength } from '@/lib/auth/strength';
import { cn } from '@/lib/utils';

const strengthColor = [
  '',
  'bg-[var(--color-terracotta)]',
  'bg-[var(--color-amber)]',
  'bg-[var(--color-lavender)]',
  'bg-[var(--color-moss)]',
] as const;

type PasswordFieldProps = {
  label?: string;
  name?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  showStrength?: boolean;
  autoComplete?: string;
  error?: string;
};

export function PasswordField({
  label = '비밀번호',
  name = 'password',
  placeholder,
  value,
  onChange,
  showStrength = false,
  autoComplete = 'new-password',
  error,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength ? passwordStrength(value) : 0;

  return (
    <div className="space-y-2">
      <label className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={cn(
            'block w-full bg-transparent border-0 border-b py-2 pr-10 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none transition-colors',
            error
              ? 'border-[var(--color-terracotta)] focus:border-[var(--color-terracotta)]'
              : 'border-[var(--color-hair-strong)] focus:border-[var(--color-ink)]',
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-0 top-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
          aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
        >
          {visible ? 'HIDE' : 'SHOW'}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={cn(
                  'h-0.5 flex-1 transition-colors duration-[140ms]',
                  bar <= strength ? strengthColor[strength] : 'bg-[var(--color-hair-strong)]',
                )}
              />
            ))}
          </div>
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-ink-soft)]">
            MIN 10 · A-Z · 0-9 · !@#
          </p>
        </div>
      )}

      {error && (
        <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]">
          {error}
        </p>
      )}
    </div>
  );
}

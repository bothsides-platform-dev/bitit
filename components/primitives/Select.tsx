'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type SelectOption = { value: string; label: string };

type SelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ options, value, onChange, className }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'block w-full appearance-none bg-transparent border-0 border-b border-[var(--color-hair-strong)]',
            'py-2 pr-6 text-[14px] font-mono text-[var(--color-ink)]',
            'focus:outline-none focus:border-[var(--color-ink)] transition-colors',
            'cursor-pointer',
            className,
          )}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 bottom-2 font-mono text-[11px] text-[var(--color-ink-soft)]"
        >
          ▾
        </span>
      </div>
    );
  },
);

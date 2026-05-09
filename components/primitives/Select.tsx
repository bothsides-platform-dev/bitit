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
            'block w-full appearance-none bg-transparent',
            'border border-[var(--md-sys-color-outline)] rounded-[var(--md-sys-shape-extra-small)]',
            'py-2 px-3 pr-8',
            'text-[length:var(--md-typescale-body-large-size)] text-[var(--md-sys-color-on-surface)]',
            'focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-colors',
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
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] text-sm"
        >
          ▾
        </span>
      </div>
    );
  },
);

'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { renameWorkspaceAction } from '@/lib/server/actions/workspace/renameWorkspaceAction';

type Props = {
  currentName: string;
  canEdit: boolean;
};

const ERROR_LABELS: Record<string, string> = {
  INVALID_INPUT: '1자 이상 200자 이하로 입력해주세요.',
  FORBIDDEN: '권한이 없습니다.',
  NOT_FOUND: '워크스페이스를 찾을 수 없습니다.',
};

export function WorkspaceNameForm({ currentName, canEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const trimmed = name.trim();
  const dirty = trimmed !== currentName && trimmed.length >= 1 && trimmed.length <= 200;

  const handleStart = () => {
    setName(currentName);
    setEditing(true);
    setError('');
  };

  const handleCancel = () => {
    setEditing(false);
    setName(currentName);
    setError('');
  };

  const handleSubmit = async () => {
    if (!dirty || submitting) return;
    setSubmitting(true);
    setError('');
    const r = await renameWorkspaceAction({ name: trimmed });
    setSubmitting(false);
    if (!r.ok) {
      setError(ERROR_LABELS[r.error] ?? r.error);
      return;
    }
    setEditing(false);
    startTransition(() => router.refresh());
  };

  if (!editing) {
    return (
      <div className="py-2.5 flex items-baseline justify-between">
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">
          이름
        </span>
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-[var(--color-ink)] font-mono tabular-nums">
            {currentName}
          </span>
          {canEdit && (
            <button
              type="button"
              onClick={handleStart}
              className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              수정
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="py-3 space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">
          이름
        </span>
        <input
          ref={inputRef}
          type="text"
          value={name}
          maxLength={200}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              handleCancel();
            }
          }}
          className="flex-1 max-w-[360px] bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-1 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors text-right"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)] text-right"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          취소
        </button>
        <Button type="button" disabled={!dirty || submitting} onClick={handleSubmit}>
          {submitting ? '저장 중…' : '저장'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import type { RfqMockFile } from '@/lib/stores/rfq-draft';
import { DRAFT_OWNER_ID } from '@/lib/server/storage/constants';
import { cn } from '@/lib/utils';

type Props = {
  value: RfqMockFile[];
  onChange: (files: RfqMockFile[]) => void;
};

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

const MAX_FILES = 5;
const MAX_BYTES = 20 * 1024 * 1024;
// Mirror the server allowlist (Step 11). Using a narrower client
// `accept` prevents users from selecting DOCX/XLSX/PPT and getting a
// 415 surprise — the UI now matches the upload route's contract.
const ACCEPT_EXT = '.pdf,.png,.jpg,.jpeg';
const ACCEPTED_MIMES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
]);

type RowState = RfqMockFile & {
  status: 'uploading' | 'ready' | 'error';
  error?: string;
};

export function RfpAttachmentDropzone({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // Local row state — extends the parent value with upload progress and
  // error messaging without leaking those into the form draft. The
  // parent's `value` array stays the source of truth for committed rows.
  const [rows, setRows] = useState<RowState[]>(() =>
    value.map((v) => ({ ...v, status: 'ready' as const })),
  );

  const sync = (next: RowState[]): void => {
    setRows(next);
    onChange(next.filter((r) => r.status === 'ready'));
  };

  const uploadOne = async (file: File, tempId: string): Promise<void> => {
    const form = new FormData();
    form.append('file', file);
    form.append('ownerKind', 'rfq_rfp');
    form.append('ownerId', DRAFT_OWNER_ID);

    try {
      const r = await fetch('/api/files/upload', {
        method: 'POST',
        body: form,
        credentials: 'same-origin',
      });
      if (!r.ok) {
        const msg =
          r.status === 413
            ? '파일이 너무 큽니다 (최대 20MB)'
            : r.status === 415
              ? '지원되지 않는 파일 형식입니다 (PDF/PNG/JPEG만 허용)'
              : `업로드 실패 (${r.status})`;
        setRows((prev) => {
          const next = prev.map((row) =>
            row.id === tempId ? { ...row, status: 'error' as const, error: msg } : row,
          );
          onChange(next.filter((rr) => rr.status === 'ready'));
          return next;
        });
        return;
      }
      const body = (await r.json()) as { id: string; name: string; size: number };
      setRows((prev) => {
        const next = prev.map((row) =>
          row.id === tempId
            ? {
                id: body.id,
                name: body.name,
                size: body.size,
                status: 'ready' as const,
              }
            : row,
        );
        onChange(next.filter((rr) => rr.status === 'ready'));
        return next;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '네트워크 오류';
      setRows((prev) => {
        const next = prev.map((row) =>
          row.id === tempId ? { ...row, status: 'error' as const, error: msg } : row,
        );
        onChange(next.filter((rr) => rr.status === 'ready'));
        return next;
      });
    }
  };

  const addFiles = (fileList: FileList | null): void => {
    if (!fileList) return;
    const remaining = MAX_FILES - rows.length;
    if (remaining <= 0) return;
    const additions: RowState[] = [];
    for (let i = 0; i < Math.min(fileList.length, remaining); i++) {
      const f = fileList[i];
      if (rows.some((r) => r.name === f.name)) continue;
      // Cheap client checks (server still re-validates).
      if (!ACCEPTED_MIMES.has(f.type)) continue;
      if (f.size > MAX_BYTES) continue;
      const tempId = `tmp-${Math.random().toString(36).slice(2, 10)}`;
      additions.push({
        id: tempId,
        name: f.name,
        size: f.size,
        status: 'uploading',
      });
      void uploadOne(f, tempId);
    }
    if (additions.length > 0) sync([...rows, ...additions]);
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeRow = (rowId: string): void => {
    sync(rows.filter((r) => r.id !== rowId));
  };

  return (
    <div className="space-y-3">
      <Eyebrow>RFP 첨부 파일 (선택)</Eyebrow>

      {rows.length < MAX_FILES && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'border border-dashed border-[var(--color-hair-strong)] py-6 text-center cursor-pointer transition-colors',
            dragging ? 'bg-[var(--color-paper-warm)] border-[var(--color-ink)]' : 'hover:border-[var(--color-ink-muted)]',
          )}
        >
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--color-ink-soft)]">
            파일을 끌어다 놓거나 클릭하여 첨부
          </p>
          <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--color-ink-faint)] mt-1">
            PDF / PNG / JPEG · 최대 {MAX_FILES}개 · 20MB 이내
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_EXT}
        className="sr-only"
        onChange={(e) => addFiles(e.target.files)}
      />

      {rows.length > 0 && (
        <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
          {rows.map((file, i) => (
            <div key={file.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-[10px] tabular-nums text-[var(--color-ink-soft)] shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[13px] text-[var(--color-ink)] truncate">{file.name}</span>
                <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-faint)] shrink-0">
                  {formatSize(file.size)}
                </span>
                {file.status === 'uploading' && (
                  <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-ink-faint)] shrink-0">
                    UPLOADING…
                  </span>
                )}
                {file.status === 'error' && (
                  <span
                    title={file.error}
                    className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)] shrink-0"
                  >
                    ERROR
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeRow(file.id)}
                className="font-mono text-[11px] text-[var(--color-ink-faint)] hover:text-[var(--color-terracotta)] transition-colors px-1 shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

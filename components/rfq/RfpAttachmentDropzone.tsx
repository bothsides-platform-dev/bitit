'use client';

import { useRef, useState } from 'react';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import type { RfqMockFile } from '@/lib/stores/rfq-draft';
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

export function RfpAttachmentDropzone({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const remaining = MAX_FILES - value.length;
    const toAdd: RfqMockFile[] = [];
    for (let i = 0; i < Math.min(fileList.length, remaining); i++) {
      const f = fileList[i];
      if (!value.some((v) => v.name === f.name)) {
        toAdd.push({ name: f.name, size: f.size });
      }
    }
    if (toAdd.length > 0) onChange([...value, ...toAdd]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <Eyebrow>RFP 첨부 파일 (선택)</Eyebrow>

      {value.length < MAX_FILES && (
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
            PDF / DOCX / XLSX · 최대 {MAX_FILES}개
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        className="sr-only"
        onChange={(e) => addFiles(e.target.files)}
      />

      {value.length > 0 && (
        <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
          {value.map((file, i) => (
            <div key={file.name} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-[10px] tabular-nums text-[var(--color-ink-soft)] shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[13px] text-[var(--color-ink)] truncate">{file.name}</span>
                <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-faint)] shrink-0">
                  {formatSize(file.size)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
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

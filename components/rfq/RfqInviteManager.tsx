'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { Label } from '@/components/primitives/Label';
import { Chip } from '@/components/primitives/Chip';
import type { ChipColor } from '@/components/primitives/Chip';
import {
  addPgWorkspacesToRfqAction,
  sendDraftInvitationsAction,
} from '@/lib/server/actions/rfq';
import { toast } from '@/lib/toast';
import type { InvitationStatus } from '@/lib/types/invitation';

type WsSearchResult = { id: string; displayName: string };

type InvitationView = {
  wsId: string;
  wsName: string;
  status: InvitationStatus;
};

type Props = {
  rfqId: string;
  invitations: InvitationView[];
  shareUrl: string;
  canEdit: boolean;
};

const statusLabel: Record<InvitationStatus, string> = {
  draft: '대기중',
  sent: '발송됨',
  opened: '열람',
  accepted: '수락',
  declined: '거절',
  expired: '만료',
};

const statusColor: Record<InvitationStatus, ChipColor> = {
  draft: 'surface',
  sent: 'surface',
  opened: 'warning',
  accepted: 'tertiary',
  declined: 'error',
  expired: 'surface',
};

export function RfqInviteManager({
  rfqId,
  invitations,
  shareUrl,
  canEdit,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WsSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputError, setInputError] = useState('');
  const [pending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const draftCount = invitations.filter((i) => i.status === 'draft').length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setInputError('');
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!q.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/workspaces/search?q=${encodeURIComponent(q)}&type=pg`,
        );
        if (res.ok) {
          const data = (await res.json()) as { workspaces: WsSearchResult[] };
          setResults(data.workspaces);
          setShowDropdown(data.workspaces.length > 0);
        }
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  const handleSelect = (ws: WsSearchResult) => {
    setShowDropdown(false);
    setQuery('');
    setResults([]);
    setInputError('');

    if (invitations.some((i) => i.wsId === ws.id)) {
      setInputError('이미 추가된 워크스페이스입니다.');
      return;
    }

    startTransition(async () => {
      const r = await addPgWorkspacesToRfqAction({ rfqId, workspaceIds: [ws.id] });
      if (!r.ok) {
        toast(`추가 실패 — ${r.error}`, { type: 'error' });
        return;
      }
      router.refresh();
    });
  };

  const handleSendDrafts = () => {
    if (draftCount === 0) return;
    startTransition(async () => {
      const r = await sendDraftInvitationsAction({ rfqId });
      if (!r.ok) {
        toast(`초대 발송 실패 — ${r.error}`, { type: 'error' });
        return;
      }
      toast(`${r.sentCount}개 PG에 초대 메일을 보냈습니다.`);
      router.refresh();
    });
  };

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast('공유 링크를 복사했습니다.');
    } catch {
      toast('링크 복사에 실패했습니다.', { type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* PG 목록 */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Label size="md" muted={false}>초대 PG</Label>
          <div className="flex-1 h-px bg-[var(--md-sys-color-outline-variant)]" />
        </div>
        {invitations.length === 0 ? (
          <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--md-sys-color-outline)]">
            초대된 PG가 없습니다.
          </p>
        ) : (
          <div className="divide-y divide-[var(--md-sys-color-outline-variant)] border-t border-[var(--md-sys-color-outline-variant)]">
            {invitations.map((inv, i) => (
              <div
                key={inv.wsId}
                className="py-2 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-[10px] tabular-nums text-[var(--md-sys-color-outline)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] text-[var(--md-sys-color-on-surface)] truncate">
                    {inv.wsName}
                  </span>
                </div>
                <Chip label={statusLabel[inv.status]} color={statusColor[inv.status]} />
              </div>
            ))}
          </div>
        )}
      </div>

      {canEdit && (
        <>
          {/* PG 검색 추가 */}
          <div className="space-y-2">
            <Label size="md" muted={false}>PG 워크스페이스 추가</Label>
            <div ref={dropdownRef} className="relative">
              <div className="flex items-end gap-3">
                <input
                  type="text"
                  value={query}
                  disabled={pending}
                  onChange={handleQueryChange}
                  onFocus={() => results.length > 0 && setShowDropdown(true)}
                  placeholder="워크스페이스 이름 검색…"
                  className="flex-1 bg-transparent border-0 border-b border-[var(--md-sys-color-outline)] py-2 text-[14px] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-outline)] focus:outline-none focus:border-[var(--md-sys-color-on-surface)] transition-colors disabled:opacity-50"
                />
                {isSearching && (
                  <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--md-sys-color-outline)] pb-2">
                    LOADING…
                  </span>
                )}
              </div>

              {showDropdown && results.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-md shadow-sm overflow-hidden">
                  {results.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => handleSelect(ws)}
                      className="w-full text-left px-3 py-2 text-[13px] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
                    >
                      {ws.displayName}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {inputError && (
              <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--md-sys-color-error)]">
                {inputError}
              </p>
            )}
            <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--md-sys-color-outline)]">
              추가된 PG는 [ 대기중 ] 상태로 누적되며, 아래 &ldquo;초대 발송&rdquo;을
              눌러야 메일이 나갑니다.
            </p>
          </div>

          {/* 초대 발송 */}
          <div className="space-y-2">
            <Button
              type="button"
              fullWidth
              size="md"
              variant={draftCount > 0 ? 'filled' : 'text'}
              disabled={draftCount === 0 || pending}
              onClick={handleSendDrafts}
            >
              {pending && draftCount > 0
                ? '발송 중…'
                : draftCount > 0
                  ? `${draftCount}개 PG에 초대 발송`
                  : '발송할 대기 PG 없음'}
            </Button>
          </div>

          {/* 공유 링크 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-1">
              <Label size="md" muted={false}>공유 링크</Label>
              <div className="flex-1 h-px bg-[var(--md-sys-color-outline-variant)]" />
            </div>
            <div className="flex items-center gap-3 border border-[var(--md-sys-color-outline-variant)] rounded-md px-3 py-2">
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 bg-transparent text-[12px] font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)] focus:outline-none truncate"
              />
              <Button
                type="button"
                variant="outlined"
                size="sm"
                onClick={handleCopyShare}
              >
                복사
              </Button>
            </div>
            <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--md-sys-color-outline)]">
              초대받은 PG 워크스페이스 멤버라면 이 링크로 입장 가능합니다.
              마감일에 자동 만료됩니다.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Tag } from '@/components/primitives/Tag';
import {
  addPgEmailsToRfqAction,
  sendDraftInvitationsAction,
} from '@/lib/server/actions/rfq';
import { toast } from '@/lib/toast';
import type { InvitationStatus } from '@/lib/types/invitation';

type InvitationView = {
  email: string;
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

const statusVariant: Record<
  InvitationStatus,
  'amber' | 'moss' | 'muted' | 'default' | 'terracotta'
> = {
  draft: 'muted',
  sent: 'default',
  opened: 'amber',
  accepted: 'moss',
  declined: 'terracotta',
  expired: 'muted',
};

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export function RfqInviteManager({
  rfqId,
  invitations,
  shareUrl,
  canEdit,
}: Props) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [pending, startTransition] = useTransition();

  const draftCount = invitations.filter((i) => i.status === 'draft').length;

  const handleAdd = () => {
    const email = input.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setInputError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    if (invitations.some((i) => i.email.toLowerCase() === email)) {
      setInputError('이미 추가된 이메일입니다.');
      return;
    }
    setInputError('');
    startTransition(async () => {
      const r = await addPgEmailsToRfqAction({ rfqId, emails: [email] });
      if (!r.ok) {
        toast(`PG 추가 실패 — ${r.error}`, { type: 'error' });
        return;
      }
      if (r.addedCount === 0 && r.skipped.length > 0) {
        toast('이미 추가된 이메일입니다.', { type: 'error' });
        return;
      }
      setInput('');
      toast('PG가 추가되었습니다. "초대 발송" 버튼으로 메일을 보내세요.');
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
          <Eyebrow>초대 PG</Eyebrow>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        {invitations.length === 0 ? (
          <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
            초대된 PG가 없습니다.
          </p>
        ) : (
          <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
            {invitations.map((inv, i) => (
              <div
                key={`${inv.email}-${i}`}
                className="py-2 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-[10px] tabular-nums text-[var(--color-ink-faint)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] text-[var(--color-ink)] truncate">
                    {inv.email}
                  </span>
                </div>
                <Tag variant={statusVariant[inv.status]}>
                  {statusLabel[inv.status]}
                </Tag>
              </div>
            ))}
          </div>
        )}
      </div>

      {canEdit && (
        <>
          {/* PG 추가 입력 */}
          <div className="space-y-2">
            <Eyebrow>PG 이메일 추가</Eyebrow>
            <div className="flex items-end gap-3">
              <input
                type="email"
                value={input}
                disabled={pending}
                onChange={(e) => {
                  setInput(e.target.value);
                  setInputError('');
                }}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), handleAdd())
                }
                placeholder="sales@pg.com"
                className="flex-1 bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors disabled:opacity-50"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!input.trim() || pending}
                onClick={handleAdd}
              >
                추가
              </Button>
            </div>
            {inputError && (
              <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]">
                {inputError}
              </p>
            )}
            <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
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
              variant={draftCount > 0 ? 'primary' : 'ghost'}
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
              <Eyebrow>공유 링크</Eyebrow>
              <div className="flex-1 h-px bg-[var(--color-hair)]" />
            </div>
            <div className="flex items-center gap-3 border border-[var(--color-hair)] rounded-md px-3 py-2">
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 bg-transparent text-[12px] font-mono tabular-nums text-[var(--color-ink-muted)] focus:outline-none truncate"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopyShare}
              >
                복사
              </Button>
            </div>
            <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
              초대된 PG 도메인의 이메일로 가입한 누구나 이 링크로 진입 가능합니다.
              마감일에 자동 만료됩니다.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

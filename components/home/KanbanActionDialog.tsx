'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/primitives/Button';
import { toast } from '@/lib/toast';
import { sendDraftInvitationsAction } from '@/lib/server/actions/rfq/sendDraftInvitationsAction';
import { cancelRfqAction } from '@/lib/server/actions/rfq/cancelRfqAction';
import { withdrawBidAction } from '@/lib/server/actions/bid/withdrawBidAction';
import type { DragAction } from './dragMatrix';

type Props = {
  action: DragAction | null;
  onClose: () => void;
  onCommitted: () => void;
};

const COPY: Record<
  DragAction['kind'],
  { title: string; bodyKey: 'rfq' | 'bid'; cta: string; danger?: boolean }
> = {
  'send-rfq': {
    title: '초대 PG에 RFQ를 발송할까요?',
    bodyKey: 'rfq',
    cta: '발송',
  },
  'cancel-rfq': {
    title: 'RFQ를 취소(종료)할까요?',
    bodyKey: 'rfq',
    cta: '취소 처리',
    danger: true,
  },
  'withdraw-bid': {
    title: '제출한 견적을 철회할까요?',
    bodyKey: 'bid',
    cta: '철회',
    danger: true,
  },
  'navigate-rfq-detail': { title: '', bodyKey: 'rfq', cta: '' },
  'navigate-inbox': { title: '', bodyKey: 'rfq', cta: '' },
};

export function KanbanActionDialog({ action, onClose, onCommitted }: Props) {
  const [submitting, setSubmitting] = useState(false);

  // navigate-* 는 다이얼로그 없이 즉시 라우팅하므로 여기 도달 안 함.
  if (
    !action ||
    action.kind === 'navigate-rfq-detail' ||
    action.kind === 'navigate-inbox'
  ) {
    return null;
  }

  const copy = COPY[action.kind];
  const heading =
    action.kind === 'withdraw-bid' || action.kind === 'cancel-rfq'
      ? `${'title' in action ? action.title : ''}`
      : 'title' in action
        ? action.title
        : '';

  const onConfirm = async () => {
    setSubmitting(true);
    try {
      let result: { ok: true } | { ok: false; error: string };
      if (action.kind === 'send-rfq') {
        const r = await sendDraftInvitationsAction({ rfqId: action.rfqId });
        result = r.ok ? { ok: true } : { ok: false, error: r.error };
      } else if (action.kind === 'cancel-rfq') {
        result = await cancelRfqAction({ rfqId: action.rfqId });
      } else if (action.kind === 'withdraw-bid') {
        result = await withdrawBidAction({ bidId: action.bidId });
      } else {
        result = { ok: false, error: 'UNREACHABLE' };
      }

      if (result.ok) {
        toast(copy.cta + ' 완료');
        onCommitted();
      } else {
        toast(`처리 실패 — ${result.error}`, { type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogTitle className="text-[16px] font-[600] text-[var(--md-sys-color-on-surface)]">
          {copy.title}
        </DialogTitle>
        <DialogDescription className="text-[13px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
          {heading}
        </DialogDescription>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="text"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            돌아가기
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={submitting}
            color={copy.danger ? 'error' : 'primary'}
          >
            {submitting ? 'LOADING…' : copy.cta}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

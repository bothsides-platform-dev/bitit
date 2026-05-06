'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Select } from '@/components/primitives/Select';
import { StatutoryCardFeeNotice } from './StatutoryCardFeeNotice';
import { submitBidAction } from '@/lib/server/actions/bid';
import { STATUTORY_CARD_FEE, type CardIssuer } from '@/lib/types/bid';
import type { MerchantGrade } from '@/lib/types/biz-profile';
import type { SettlementCycle } from '@/lib/types/bid';
import { cn } from '@/lib/utils';

const CARD_ISSUERS: { key: CardIssuer; label: string }[] = [
  { key: 'BC', label: 'BC카드' },
  { key: 'SHINHAN', label: '신한카드' },
  { key: 'SAMSUNG', label: '삼성카드' },
  { key: 'HYUNDAI', label: '현대카드' },
  { key: 'KB', label: 'KB국민카드' },
  { key: 'LOTTE', label: '롯데카드' },
  { key: 'NH', label: 'NH농협카드' },
  { key: 'HANA', label: '하나카드' },
  { key: 'WOORI', label: '우리카드' },
];

const SETTLE_CYCLES: { value: SettlementCycle; label: string }[] = [
  { value: 'D+0', label: 'D+0 (당일)' },
  { value: 'D+1', label: 'D+1 (익일)' },
  { value: 'D+2', label: 'D+2 (2영업일)' },
  { value: 'weekly', label: '주 1회 정산' },
  { value: 'monthly', label: '월 1회 정산' },
];

const inputBase =
  'block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] font-mono tabular-nums text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors';

const ERROR_LABELS: Record<string, string> = {
  FORBIDDEN_PG: 'PG 사용자 권한이 필요합니다.',
  FORBIDDEN: '이 RFQ에 입찰할 권한이 없습니다.',
  INVALID_INPUT: '입력 값을 확인해주세요.',
  RFQ_NOT_FOUND: 'RFQ를 찾을 수 없습니다.',
  RFQ_NOT_OPEN: '마감되었거나 이미 종료된 RFQ입니다.',
  INVITATION_NOT_FOUND: '초대 내역을 찾을 수 없습니다.',
  BID_ALREADY_SUBMITTED: '이미 견적을 제출하셨습니다.',
};

function PctInput({
  label,
  value,
  onChange,
  placeholder = '0.00',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Eyebrow>{label}</Eyebrow>
      <div className="flex items-end gap-1">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(inputBase, 'flex-1')}
        />
        <span className="font-mono text-[13px] text-[var(--color-ink-soft)] pb-2">%</span>
      </div>
    </div>
  );
}

function KrwInput({
  label,
  value,
  onChange,
  placeholder = '0',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Eyebrow>{label}</Eyebrow>
      <div className="flex items-end gap-1">
        <input
          type="number"
          min="0"
          step="1000"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(inputBase, 'flex-1')}
        />
        <span className="font-mono text-[13px] text-[var(--color-ink-soft)] pb-2">원</span>
      </div>
    </div>
  );
}

type Props = {
  rfqId: string;
  // invitationId는 prop으로 받지 않는다 — 서버 액션이 session.userId 기반으로
  // findByRfq 후 고유 invitation을 픽업한다(canAccess 가드 포함).
  grade: MerchantGrade | undefined;
};

export function BidForm({ rfqId, grade }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [settleCycle, setSettleCycle] = useState<SettlementCycle>('D+1');
  const [deposit, setDeposit] = useState('0');
  const [setupFee, setSetupFee] = useState('0');
  const [monthlyMin, setMonthlyMin] = useState('0');
  const [bankPct, setBankPct] = useState('');
  const [easyPayPct, setEasyPayPct] = useState('');
  const [cardFees, setCardFees] = useState<Record<CardIssuer, string>>({
    BC: '', SHINHAN: '', SAMSUNG: '', HYUNDAI: '', KB: '', LOTTE: '', NH: '', HANA: '', WOORI: '',
  });
  const [overseasPct, setOverseasPct] = useState('');
  const [memo, setMemo] = useState('');

  // Proposal PDF state — uploaded eagerly to /api/files/upload (Step 11)
  // so the bid action only sees the resulting attachment id. The preview
  // iframe targets /api/files/{id} which carries the user's session cookie.
  const proposalInputRef = useRef<HTMLInputElement>(null);
  const [proposal, setProposal] = useState<
    | { id: string; name: string; size: number }
    | { name: string; status: 'uploading' }
    | { name: string; status: 'error'; error: string }
    | null
  >(null);

  const uploadProposal = async (file: File): Promise<void> => {
    if (file.type !== 'application/pdf') {
      setProposal({ name: file.name, status: 'error', error: 'PDF만 업로드 가능합니다.' });
      return;
    }
    setProposal({ name: file.name, status: 'uploading' });
    const form = new FormData();
    form.append('file', file);
    form.append('ownerKind', 'bid_proposal');
    form.append('ownerId', rfqId);
    try {
      const r = await fetch('/api/files/upload', {
        method: 'POST',
        body: form,
        credentials: 'same-origin',
      });
      if (!r.ok) {
        setProposal({
          name: file.name,
          status: 'error',
          error:
            r.status === 413
              ? '파일이 너무 큽니다 (최대 20MB)'
              : r.status === 415
                ? '지원되지 않는 파일 형식입니다'
                : `업로드 실패 (${r.status})`,
        });
        return;
      }
      const body = (await r.json()) as { id: string; name: string; size: number };
      setProposal(body);
    } catch (err) {
      setProposal({
        name: file.name,
        status: 'error',
        error: err instanceof Error ? err.message : '네트워크 오류',
      });
    }
  };

  const proposalReady = proposal && 'id' in proposal;
  const proposalUploading = proposal && 'status' in proposal && proposal.status === 'uploading';

  const isGeneral = grade === 'general';
  const cardFeeStatutory = grade && !isGeneral ? STATUTORY_CARD_FEE[grade] : null;

  const canSubmit =
    !pending &&
    !proposalUploading &&
    bankPct !== '' && parseFloat(bankPct) >= 0 &&
    easyPayPct !== '' && parseFloat(easyPayPct) >= 0 &&
    (!isGeneral || CARD_ISSUERS.every((c) => cardFees[c.key] !== ''));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitError(null);

    const pct = (s: string) => parseFloat(s) / 100;

    // 영세/중소 1~3 등급은 클라이언트가 cardFeesByIssuer 생략(서버도 강제로 null
    // 처리 — advisor pin 1). 일반에서만 9개 카드사 입력.
    const cardFeesByIssuer = isGeneral
      ? (Object.fromEntries(
          CARD_ISSUERS.map((c) => [c.key, pct(cardFees[c.key])]),
        ) as Record<CardIssuer, number>)
      : undefined;

    startTransition(async () => {
      const r = await submitBidAction({
        rfqId,
        settleCycle,
        deposit: parseInt(deposit) || 0,
        setupFee: parseInt(setupFee) || 0,
        monthlyMin: parseInt(monthlyMin) || 0,
        bankTransferFeePct: pct(bankPct),
        easyPayFeePct: pct(easyPayPct),
        cardFeesByIssuer,
        overseasCardFeePct: isGeneral && overseasPct ? pct(overseasPct) : undefined,
        proposalAttachmentId: proposalReady ? proposal.id : undefined,
        memo: memo.trim() || undefined,
      });
      if (r.ok) {
        router.push(`/inbox/${rfqId}/submitted`);
        router.refresh();
      } else {
        setSubmitError(r.error);
      }
    });
  };

  return (
    <form className="space-y-10" onSubmit={handleSubmit}>
      {/* 법정 수수료 안내 */}
      {grade && !isGeneral && cardFeeStatutory !== null && (
        <StatutoryCardFeeNotice grade={grade} />
      )}

      {/* 01 정산 조건 */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">
            01 — 정산 조건
          </span>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <div className="col-span-2 space-y-1">
            <Eyebrow>정산 주기</Eyebrow>
            <Select
              options={SETTLE_CYCLES.map((c) => ({ value: c.value, label: c.label }))}
              value={settleCycle}
              onChange={(v) => setSettleCycle(v as SettlementCycle)}
            />
          </div>
          <KrwInput label="보증금" value={deposit} onChange={setDeposit} />
          <KrwInput label="셋업비" value={setupFee} onChange={setSetupFee} />
          <KrwInput label="월최저수수료" value={monthlyMin} onChange={setMonthlyMin} />
        </div>
      </section>

      {/* 02 수수료 */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">
            02 — 수수료
          </span>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <PctInput label="계좌이체 수수료 *" value={bankPct} onChange={setBankPct} placeholder="1.50" />
          <PctInput label="간편결제 수수료 *" value={easyPayPct} onChange={setEasyPayPct} placeholder="1.80" />
          {isGeneral && (
            <>
              {CARD_ISSUERS.map((c) => (
                <PctInput
                  key={c.key}
                  label={`${c.label} *`}
                  value={cardFees[c.key]}
                  onChange={(v) => setCardFees((prev) => ({ ...prev, [c.key]: v }))}
                  placeholder="1.50"
                />
              ))}
              <PctInput label="해외카드 수수료" value={overseasPct} onChange={setOverseasPct} placeholder="3.00" />
            </>
          )}
        </div>
      </section>

      {/* 03 제안서 */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">
            03 — 제안서
          </span>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Eyebrow>제안서 PDF (선택)</Eyebrow>
            <input
              ref={proposalInputRef}
              type="file"
              accept=".pdf"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadProposal(f);
                e.target.value = '';
              }}
            />
            {!proposal && (
              <button
                type="button"
                onClick={() => proposalInputRef.current?.click()}
                className="block w-full border border-dashed border-[var(--color-hair-strong)] py-5 text-center hover:border-[var(--color-ink)] transition-colors"
              >
                <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--color-ink-soft)]">
                  PDF 업로드 (클릭)
                </p>
                <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--color-ink-faint)] mt-1">
                  20MB 이내
                </p>
              </button>
            )}
            {proposal && 'status' in proposal && proposal.status === 'uploading' && (
              <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-ink-faint)]">
                {proposal.name} — UPLOADING…
              </p>
            )}
            {proposal && 'status' in proposal && proposal.status === 'error' && (
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]">
                  {proposal.name} — {proposal.error}
                </p>
                <button
                  type="button"
                  onClick={() => setProposal(null)}
                  className="font-mono text-[11px] text-[var(--color-ink-faint)] hover:text-[var(--color-terracotta)] px-1"
                >
                  ×
                </button>
              </div>
            )}
            {proposalReady && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[var(--color-ink)] truncate">{proposal.name}</span>
                  <button
                    type="button"
                    onClick={() => setProposal(null)}
                    className="font-mono text-[11px] text-[var(--color-ink-faint)] hover:text-[var(--color-terracotta)] px-1 shrink-0"
                  >
                    ×
                  </button>
                </div>
                <iframe
                  src={`/api/files/${proposal.id}`}
                  title={proposal.name}
                  className="w-full h-[320px] border border-[var(--color-hair)] bg-[var(--color-paper-warm)]"
                />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Eyebrow>메모</Eyebrow>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="추가 안내 사항이 있으면 입력하세요."
              className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors resize-none"
            />
          </div>
        </div>
      </section>

      {!canSubmit && !pending && (
        <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
          · 계좌이체·간편결제 수수료 입력 필요
          {isGeneral && ' · 카드사 9개 수수료 모두 입력 필요'}
        </p>
      )}

      {submitError && (
        <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-terracotta)]">
          {ERROR_LABELS[submitError] ?? submitError}
        </p>
      )}

      <Button type="submit" fullWidth size="lg" disabled={!canSubmit}>
        {pending ? '제출 중…' : '견적 제출'}
      </Button>
    </form>
  );
}

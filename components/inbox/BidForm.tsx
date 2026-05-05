'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { StatutoryCardFeeNotice } from './StatutoryCardFeeNotice';
import { useBidListStore } from '@/lib/stores/bid-list';
import { MOCK_SESSION_PG } from '@/lib/mock/workspaces';
import { STATUTORY_CARD_FEE, type CardIssuer } from '@/lib/types/bid';
import type { MerchantGrade } from '@/lib/types/biz-profile';
import type { Bid, SettlementCycle } from '@/lib/types/bid';
import type { RfqMockFile } from '@/lib/stores/rfq-draft';
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
  invitationId: string;
  grade: MerchantGrade | undefined;
};

export function BidForm({ rfqId, invitationId, grade }: Props) {
  const router = useRouter();
  const addBid = useBidListStore((s) => s.addBid);

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
  const [proposalFile, setProposalFile] = useState<RfqMockFile | null>(null);
  const [memo, setMemo] = useState('');

  const isGeneral = grade === 'general';
  const cardFeeStatutory = grade && !isGeneral ? STATUTORY_CARD_FEE[grade] : null;

  const canSubmit =
    bankPct !== '' && parseFloat(bankPct) >= 0 &&
    easyPayPct !== '' && parseFloat(easyPayPct) >= 0 &&
    (!isGeneral || CARD_ISSUERS.every((c) => cardFees[c.key] !== ''));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setProposalFile({ name: f.name, size: f.size });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const pct = (s: string) => parseFloat(s) / 100;
    const bid: Bid = {
      id: `bid-${Date.now()}`,
      rfqId,
      pgWsId: MOCK_SESSION_PG.workspaceId,
      invitationId,
      settleCycle,
      deposit: parseInt(deposit) || 0,
      setupFee: parseInt(setupFee) || 0,
      monthlyMin: parseInt(monthlyMin) || 0,
      bankTransferFeePct: pct(bankPct),
      easyPayFeePct: pct(easyPayPct),
      ...(isGeneral && {
        cardFeesByIssuer: Object.fromEntries(
          CARD_ISSUERS.map((c) => [c.key, pct(cardFees[c.key])]),
        ) as Record<CardIssuer, number>,
        overseasCardFeePct: overseasPct ? pct(overseasPct) : undefined,
      }),
      proposalPdf: proposalFile
        ? { id: `pdf-${Date.now()}`, name: proposalFile.name, size: proposalFile.size, mimeType: 'application/pdf', url: '' }
        : { id: 'pdf-none', name: '제안서 미첨부', size: 0, mimeType: 'application/pdf', url: '' },
      memo: memo.trim() || undefined,
      status: 'submitted',
      submittedBy: MOCK_SESSION_PG.userId,
      submittedAt: new Date().toISOString(),
    };

    addBid(bid);
    router.push(`/inbox/${rfqId}/submitted`);
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
            <select
              value={settleCycle}
              onChange={(e) => setSettleCycle(e.target.value as SettlementCycle)}
              className={inputBase}
            >
              {SETTLE_CYCLES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
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
          <div className="space-y-1">
            <Eyebrow>제안서 PDF</Eyebrow>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] border border-[var(--color-hair-strong)] px-3 py-1.5 hover:border-[var(--color-ink)] transition-colors">
                파일 선택
                <input type="file" accept=".pdf" className="sr-only" onChange={handleFileChange} />
              </label>
              {proposalFile && (
                <span className="text-[13px] text-[var(--color-ink)]">
                  {proposalFile.name}
                  <button
                    type="button"
                    onClick={() => setProposalFile(null)}
                    className="ml-2 font-mono text-[11px] text-[var(--color-ink-faint)] hover:text-[var(--color-terracotta)]"
                  >
                    ×
                  </button>
                </span>
              )}
              {!proposalFile && (
                <span className="font-mono text-[11px] text-[var(--color-ink-faint)]">선택하지 않음</span>
              )}
            </div>
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

      {!canSubmit && (
        <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
          · 계좌이체·간편결제 수수료 입력 필요
          {isGeneral && ' · 카드사 9개 수수료 모두 입력 필요'}
        </p>
      )}

      <Button type="submit" fullWidth size="lg" disabled={!canSubmit}>
        견적 제출
      </Button>
    </form>
  );
}

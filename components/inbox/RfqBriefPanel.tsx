import { Chip } from '@/components/primitives/Chip';
import { Label } from '@/components/primitives/Label';
import { GRADE_LABELS } from '@/lib/types/biz-profile';
import { STATUTORY_CARD_FEE } from '@/lib/types/bid';
import { formatDate, formatDeadline } from '@/lib/format';
import type { RFQ } from '@/lib/types/rfq';

type Props = { rfq: RFQ };

export function RfqBriefPanel({ rfq }: Props) {
  const bizProfile = rfq.bizProfile;
  const bizNoMissing = !bizProfile?.bizNo;
  const grade = bizProfile?.grade;
  const cardFee = grade ? STATUTORY_CARD_FEE[grade] : NaN;
  const daysLeft = formatDeadline(rfq.deadline);
  const isUrgent = daysLeft.startsWith('D-') && parseInt(daysLeft.slice(2)) <= 3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-soft)]">{rfq.id}</span>
        <h2 className="text-[22px] font-[700] tracking-[-0.02em] text-[var(--color-ink)] mt-0.5">
          {rfq.title}
        </h2>
        <div className="flex items-center gap-3 mt-2">
          <span
            className={`font-mono text-[12px] tabular-nums font-medium ${isUrgent ? 'text-[var(--color-terracotta)]' : 'text-[var(--color-ink-muted)]'}`}
          >
            마감 {daysLeft} ({formatDate(rfq.deadline)})
          </span>
        </div>
      </div>

      {bizNoMissing && (
        <div className="border border-[var(--color-hair)] px-4 py-3 space-y-1">
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
            [ 사업자번호 미입력 ]
          </div>
          <p className="text-[12px] leading-relaxed text-[var(--color-ink-muted)]">
            사전 견적 또는 보완 예정 RFQ — 일반 등급 가정으로 9개 카드사별 견적을 작성하세요.
          </p>
        </div>
      )}

      {/* Buyer biz info */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Label size="md" muted={false}>구매사 정보</Label>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
          {[
            ['상호명', '(주)샘플테크'],
            ['사업자번호', bizProfile?.bizNo ?? '미입력'],
            ['대표자', '—'],
          ].map(([label, value]) => (
            <div key={label} className="py-2.5 flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">{label}</span>
              <span className="text-[13px] text-[var(--color-ink)]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grade + statutory fee */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Label size="md" muted={false}>가맹점 등급</Label>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <div className="flex items-center justify-between py-2.5 border-t border-[var(--color-hair)] border-b border-[var(--color-hair)]">
          <div className="flex items-center gap-3">
            {grade ? (
              <>
                <Chip label={GRADE_LABELS[grade]} color="surface" />
                {!isNaN(cardFee) && (
                  <span className="font-mono text-[12px] tabular-nums text-[var(--color-ink-muted)]">
                    카드 법정 {(cardFee * 100).toFixed(2)}%
                  </span>
                )}
                {isNaN(cardFee) && (
                  <span className="font-mono text-[12px] text-[var(--color-ink-muted)]">
                    일반등급 — 카드사별 수수료 입력 필요
                  </span>
                )}
              </>
            ) : (
              <>
                <Chip label="미정" color="surface" />
                <span className="font-mono text-[12px] text-[var(--color-ink-muted)]">
                  등급 미입력 — 일반 가정으로 카드사별 수수료 입력 필요
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Memo */}
      {rfq.memo && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Label size="md" muted={false}>메모 (RFP)</Label>
            <div className="flex-1 h-px bg-[var(--color-hair)]" />
          </div>
          <p className="text-[13px] text-[var(--color-ink-muted)] leading-relaxed whitespace-pre-wrap">
            {rfq.memo}
          </p>
        </div>
      )}
    </div>
  );
}

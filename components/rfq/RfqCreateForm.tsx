'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { GradeConfirmPanel } from './GradeConfirmPanel';
import { PgEmailAllowlist } from './PgEmailAllowlist';
import { RfpAttachmentDropzone } from './RfpAttachmentDropzone';
import { useRfqDraftStore } from '@/lib/stores/rfq-draft';
import { useShortcut } from '@/lib/hooks/useShortcut';
import { createRfqAction } from '@/lib/server/actions/rfq';
import { STATUTORY_CARD_FEE } from '@/lib/types/bid';
import type { BizProfile, MerchantGrade } from '@/lib/types/biz-profile';

const GRADE_LABELS: Record<MerchantGrade, string> = {
  small: '영세',
  sme1: '중소 1',
  sme2: '중소 2',
  sme3: '중소 3',
  general: '일반',
};

function SectionHeader({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">
        {num} — {label}
      </span>
      <div className="flex-1 h-px bg-[var(--color-hair)]" />
    </div>
  );
}

type Props = {
  /**
   * Workspace의 현재 사업자 프로필. RSC 부모(`/rfq/new`)에서 fetch 한 뒤
   * read-only로 표시. createRfqAction이 서버에서 직접 workspace.bizProfileId
   * 를 읽어 스냅샷을 만들기 때문에 클라가 bizNo를 보내지는 않는다.
   */
  bizProfile: Pick<BizProfile, 'bizNo' | 'taxType' | 'status' | 'grade'>;
  /** 회사명 (Workspace.name) — 표시용 */
  workspaceName: string;
};

export function RfqCreateForm({ bizProfile, workspaceName }: Props) {
  const router = useRouter();
  const draft = useRfqDraftStore();

  // RFQ별 등급 재확인/오버라이드. workspace.grade 가 있으면 기본은 그 값을
  // 따르고, 사용자가 별도 라디오로 다른 등급을 고르면 user_overridden로
  // gradeOverride에 보낸다.
  const [overrideGrade, setOverrideGrade] = useState<MerchantGrade | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>('');
  const [minDate] = useState(
    () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
  );

  const handleDraftSave = useCallback(() => {
    setSavedAt(
      new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    );
  }, []);

  useShortcut(
    's',
    (e) => {
      e.preventDefault();
      handleDraftSave();
    },
    { meta: true, preventInInput: false },
  );

  const canSend =
    draft.title.trim() !== '' &&
    draft.allowedPgEmails.length > 0 &&
    draft.deadline !== '';

  const effectiveGrade = overrideGrade ?? bizProfile.grade;
  const cardFee = effectiveGrade ? STATUTORY_CARD_FEE[effectiveGrade] : Number.NaN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || submitting) return;
    setSubmitting(true);
    setServerError('');
    const r = await createRfqAction({
      title: draft.title.trim(),
      memo: draft.memo.trim() || undefined,
      deadline: draft.deadline,
      allowedPgEmails: draft.allowedPgEmails,
      gradeOverride: overrideGrade ?? undefined,
      send: true,
    });
    setSubmitting(false);
    if (!r.ok) {
      setServerError(r.error);
      return;
    }
    draft.reset();
    router.push(`/rfq/${r.rfqId}`);
  };

  return (
    <form className="space-y-12" onSubmit={handleSubmit}>
      {/* 01 사업자 정보 — read-only (workspace 시점) */}
      <section>
        <SectionHeader num="01" label="사업자 정보" />
        <div className="border border-[var(--color-hair)] divide-y divide-[var(--color-hair)]">
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
              WORKSPACE — 등록된 사업자
            </span>
            <span className="font-mono text-[10px] tracking-[0.1em] text-[var(--color-moss)]">
              ✓ 확인됨
            </span>
          </div>
          {[
            ['상호명', workspaceName],
            ['사업자번호', bizProfile.bizNo],
            [
              '과세 유형',
              bizProfile.taxType === 'general'
                ? '일반과세'
                : bizProfile.taxType === 'simple'
                  ? '간이과세'
                  : '면세',
            ],
            [
              '사업자 상태',
              bizProfile.status === 'active'
                ? '정상'
                : bizProfile.status === 'suspended'
                  ? '휴업'
                  : '폐업',
            ],
            ...(bizProfile.grade
              ? [
                  ['가맹점 등급 (현재)', GRADE_LABELS[bizProfile.grade]],
                  [
                    '카드 수수료',
                    Number.isNaN(cardFee)
                      ? '카드사별 협의'
                      : `${(cardFee * 100).toFixed(2)}%`,
                  ],
                ]
              : []),
          ].map(([label, value]) => (
            <div key={label} className="px-4 py-2.5 flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">
                {label}
              </span>
              <span className="text-[13px] text-[var(--color-ink)] font-mono tabular-nums">
                {value}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
          사업자 정보 갱신은 설정 → 프로필에서 가능합니다.
        </p>
      </section>

      {/* 01-bis 등급 재확인 / 오버라이드 (선택) */}
      <section>
        <SectionHeader num="01-B" label="가맹점 등급 (이번 RFQ 한정)" />
        <div className="space-y-2">
          <Eyebrow>현재 등급과 다른 등급으로 견적을 받고 싶다면 변경하세요.</Eyebrow>
          <GradeConfirmPanel
            onConfirm={(g) => setOverrideGrade(g)}
          />
          {overrideGrade && (
            <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-amber)]">
              · 이번 RFQ는 {GRADE_LABELS[overrideGrade]} 로 발송됩니다 (override).
            </p>
          )}
        </div>
      </section>

      {/* 02 견적 내용 */}
      <section>
        <SectionHeader num="02" label="견적 내용" />
        <div className="space-y-5">
          <div className="space-y-1">
            <Eyebrow>제목 *</Eyebrow>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => draft.setField('title', e.target.value)}
              placeholder="2026 결제 인프라 견적"
              className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
            />
          </div>
          <div className="space-y-1">
            <Eyebrow>자유 메모 (RFP)</Eyebrow>
            <textarea
              value={draft.memo}
              onChange={(e) => draft.setField('memo', e.target.value)}
              rows={4}
              placeholder="카드결제·간편결제 통합 솔루션 검토 중입니다. 정산주기 D+1 이내 희망."
              className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors resize-none"
            />
          </div>
          <RfpAttachmentDropzone
            value={draft.rfpFiles}
            onChange={(files) => draft.setField('rfpFiles', files)}
          />
        </div>
      </section>

      {/* 03 PG 이메일 */}
      <section>
        <SectionHeader num="03" label="초대할 PG 이메일" />
        <PgEmailAllowlist
          value={draft.allowedPgEmails}
          onChange={(emails) => draft.setField('allowedPgEmails', emails)}
        />
      </section>

      {/* 04 발송 조건 */}
      <section>
        <SectionHeader num="04" label="발송 조건" />
        <div className="space-y-6">
          <div className="space-y-1">
            <Eyebrow>마감일 *</Eyebrow>
            <input
              type="date"
              value={draft.deadline ? draft.deadline.slice(0, 10) : ''}
              min={minDate}
              onChange={(e) =>
                draft.setField(
                  'deadline',
                  e.target.value ? `${e.target.value}T23:59:59Z` : '',
                )
              }
              className="block bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] font-mono tabular-nums text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
            />
          </div>

          {!canSend && (
            <ul className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)] space-y-1">
              {!draft.title.trim() && <li>· 견적 제목 입력 필요</li>}
              {draft.allowedPgEmails.length === 0 && (
                <li>· PG 이메일 1개 이상 추가 필요</li>
              )}
              {!draft.deadline && <li>· 마감일 선택 필요</li>}
            </ul>
          )}

          {serverError && (
            <p
              role="alert"
              className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]"
            >
              발송 실패 — {serverError}
            </p>
          )}

          <Button type="submit" fullWidth size="lg" disabled={!canSend || submitting}>
            {submitting
              ? '발송 중…'
              : draft.allowedPgEmails.length > 0
                ? `${draft.allowedPgEmails.length}개 PG사에 발송`
                : '발송'}
          </Button>

          <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-ink-faint)]">
            <span>
              <kbd className="text-[var(--color-ink-soft)]">⌘S</kbd> 임시 저장
            </span>
            {savedAt && (
              <span className="text-[var(--color-moss)]">✓ 저장됨 {savedAt}</span>
            )}
          </div>
        </div>
      </section>
    </form>
  );
}

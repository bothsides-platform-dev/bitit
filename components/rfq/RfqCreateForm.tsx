'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { Label } from '@/components/primitives/Label';
import { PgEmailAllowlist } from './PgEmailAllowlist';
import { RfpAttachmentDropzone } from './RfpAttachmentDropzone';
import { useRfqDraftStore } from '@/lib/stores/rfq-draft';
import { useShortcut } from '@/lib/hooks/useShortcut';
import { createRfqAction } from '@/lib/server/actions/rfq';
import type { BizProfile } from '@/lib/types/biz-profile';

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
   * Workspace 의 현재 사업자 프로필. 미등록(undefined) 일 수 있다 —
   * 사전 견적 모드(법인 미설립/보완 예정)는 RFQ 작성 시점에 "사업자번호 없이"
   * 발송되는 케이스. createRfqAction 의 `bizProfileMode='inherit'` 가 자동으로
   * `'none'` 폴백으로 동작.
   */
  bizProfile?: Pick<BizProfile, 'bizNo' | 'taxType' | 'status'>;
  /** 회사명 (Workspace.name) — 표시용 */
  workspaceName: string;
};

export function RfqCreateForm({ bizProfile, workspaceName }: Props) {
  const router = useRouter();
  const draft = useRfqDraftStore();

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
      // Attachments uploaded to /api/files/upload land with ownerId='__draft__';
      // the action patches them to the new rfqId after RFQ insert (Step 11 wiring).
      rfpAttachmentIds: draft.rfpFiles.map((f) => f.id),
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
    <form className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12 lg:h-full" onSubmit={handleSubmit}>
      {/* Left column: sections 01, 02, 03 — independent scroll on lg+ */}
      <div className="space-y-12 lg:border-r lg:border-[var(--color-hair)] lg:pr-10 lg:overflow-y-auto lg:min-h-0">
        {/* 01 사업자 정보 — read-only (workspace 시점) 또는 미입력 안내 */}
        <section>
          <SectionHeader num="01" label="사업자 정보" />
          {bizProfile ? (
            <>
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
                  ['사업자번호', bizProfile.bizNo ?? '미입력'],
                  [
                    '과세 유형',
                    bizProfile.taxType === 'general'
                      ? '일반과세'
                      : bizProfile.taxType === 'simple'
                        ? '간이과세'
                        : bizProfile.taxType === 'exempt'
                          ? '면세'
                          : '—',
                  ],
                  [
                    '사업자 상태',
                    bizProfile.status === 'active'
                      ? '정상'
                      : bizProfile.status === 'suspended'
                        ? '휴업'
                        : bizProfile.status === 'closed'
                          ? '폐업'
                          : '—',
                  ],
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
            </>
          ) : (
            <div className="border border-[var(--color-hair)] px-4 py-4 space-y-2">
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
                [ 사업자번호 미입력 ]
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--color-ink)]">
                사업자번호 없이 작성 중입니다.
              </p>
              <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
                법인 설립 후에는 설정 → 프로필에서 사업자번호를 등록할 수 있습니다.
              </p>
            </div>
          )}
        </section>

        {/* 02 견적 내용 */}
        <section>
          <SectionHeader num="02" label="견적 내용" />
          <div className="space-y-5">
            <div className="space-y-1">
              <Label size="md" muted={false}>제목 *</Label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => draft.setField('title', e.target.value)}
                placeholder="2026 결제 인프라 견적"
                className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
              />
            </div>
            <div className="space-y-1">
              <Label size="md" muted={false}>자유 메모 (RFP)</Label>
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
      </div>

      {/* Right column: section 04 — fixed in place on lg+ (defensive overflow-y-auto for tall content) */}
      <div className="mt-12 lg:mt-0 lg:overflow-y-auto lg:min-h-0">
        <section>
          <SectionHeader num="04" label="발송 조건" />
          <div className="space-y-6">
            <div className="space-y-1">
              <Label size="md" muted={false}>마감일 *</Label>
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
                {`발송 실패 — ${serverError}`}
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
      </div>
    </form>
  );
}

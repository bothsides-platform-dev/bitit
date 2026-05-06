'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { BizLookupField, type BizLookupResult } from './BizLookupField';
import { GradeConfirmPanel } from './GradeConfirmPanel';
import { lookupBizNo } from '@/lib/mock/biz-lookup';
import { PgEmailAllowlist } from './PgEmailAllowlist';
import { RfpAttachmentDropzone } from './RfpAttachmentDropzone';
import { useRfqDraftStore } from '@/lib/stores/rfq-draft';
import { useRfqListStore } from '@/lib/stores/rfq-list';
import { useNotificationsStore } from '@/lib/stores/notifications';
import { useShortcut } from '@/lib/hooks/useShortcut';
import { MOCK_SESSION_BUYER } from '@/lib/mock/workspaces';
import type { BizProfile } from '@/lib/types/biz-profile';
import type { RFQ } from '@/lib/types/rfq';

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

function makeRfqId(total: number): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(total + 1).padStart(4, '0');
  return `Q-${yy}${mm}-${seq}`;
}

export function RfqCreateForm() {
  const router = useRouter();
  const draft = useRfqDraftStore();
  const addRfq = useRfqListStore((s) => s.addRfq);
  const rfqs = useRfqListStore((s) => s.rfqs);
  const addNotification = useNotificationsStore((s) => s.add);

  // Slim NTS-confirmed profile (only DB-shaped fields after Step 6 trim).
  const [baseProfile, setBaseProfile] = useState<BizLookupResult | null>(null);
  const [gradeConfirmed, setGradeConfirmed] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [minDate] = useState(() => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10));

  const handleDraftSave = useCallback(() => {
    setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  useShortcut('s', (e) => {
    e.preventDefault();
    handleDraftSave();
  }, { meta: true, preventInInput: false });

  const canSend =
    draft.bizProfile !== null &&
    gradeConfirmed &&
    draft.title.trim() !== '' &&
    draft.allowedPgEmails.length > 0 &&
    draft.deadline !== '';

  const handleGradeConfirm = (
    grade: NonNullable<BizProfile['grade']>,
    gradeSource: BizProfile['gradeSource'],
  ) => {
    if (!baseProfile) return;
    draft.setBizProfile({
      bizNo: baseProfile.bizNo,
      taxType: baseProfile.taxType,
      status: baseProfile.status,
      grade,
      gradeSource,
    });
    setGradeConfirmed(true);
  };

  // TODO Step 7: replace with `lookupBizNoAction` server action.
  const stubLookup = async (bizNo: string) => {
    const found = await lookupBizNo(bizNo);
    if (!found) return { valid: false as const };
    return {
      valid: true as const,
      taxType: found.taxType,
      status: found.status,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || !draft.bizProfile) return;

    const now = new Date().toISOString();
    const rfq: RFQ = {
      id: makeRfqId(rfqs.length),
      buyerWsId: 'ws-buyer-001',
      bizProfile: draft.bizProfile,
      title: draft.title.trim(),
      memo: draft.memo.trim(),
      rfpFiles: [],
      allowedPgEmails: draft.allowedPgEmails,
      deadline: draft.deadline,
      status: 'sent',
      createdBy: 'u-buyer-001',
      createdAt: now,
      sentAt: now,
    };

    addRfq(rfq);

    addNotification({
      userId: MOCK_SESSION_BUYER.userId,
      workspaceId: MOCK_SESSION_BUYER.workspaceId,
      type: 'rfq_invited',
      title: `${rfq.id} — ${draft.allowedPgEmails.length}개 PG에 초대 발송`,
      body: `${rfq.title.trim()} 견적 요청이 ${draft.allowedPgEmails.join(', ')} 에 발송되었습니다.`,
      channel: 'email',
      status: 'sent',
      linkUrl: `/rfq/${rfq.id}`,
    });

    draft.reset();
    router.push('/rfq');
  };

  return (
    <form className="space-y-12" onSubmit={handleSubmit}>
      {/* 01 사업자 정보 */}
      <section>
        <SectionHeader num="01" label="사업자 정보" />
        <div className="space-y-6">
          <BizLookupField
            onLookup={stubLookup}
            onResult={(profile) => {
              setBaseProfile(profile);
              setGradeConfirmed(false);
              draft.setBizProfile(null);
            }}
            onReset={() => {
              setBaseProfile(null);
              setGradeConfirmed(false);
              draft.setBizProfile(null);
            }}
          />

          {baseProfile && (
            <div className="space-y-2">
              <Eyebrow>가맹점 등급 (카드 우대수수료)</Eyebrow>
              <GradeConfirmPanel onConfirm={handleGradeConfirm} />
            </div>
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
                draft.setField('deadline', e.target.value ? `${e.target.value}T23:59:59Z` : '')
              }
              className="block bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] font-mono tabular-nums text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
            />
          </div>

          {!canSend && (
            <ul className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)] space-y-1">
              {!draft.bizProfile && <li>· 사업자 조회 및 등급 확인 필요</li>}
              {!draft.title.trim() && <li>· 견적 제목 입력 필요</li>}
              {draft.allowedPgEmails.length === 0 && <li>· PG 이메일 1개 이상 추가 필요</li>}
              {!draft.deadline && <li>· 마감일 선택 필요</li>}
            </ul>
          )}

          <Button type="submit" fullWidth size="lg" disabled={!canSend}>
            {draft.allowedPgEmails.length > 0
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

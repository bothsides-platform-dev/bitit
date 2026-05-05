'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { BizLookupField } from './BizLookupField';
import { GradeConfirmPanel } from './GradeConfirmPanel';
import { PgEmailAllowlist } from './PgEmailAllowlist';
import { RfpAttachmentDropzone } from './RfpAttachmentDropzone';
import { useRfqDraftStore } from '@/lib/stores/rfq-draft';
import { useRfqListStore } from '@/lib/stores/rfq-list';
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

  const [baseProfile, setBaseProfile] = useState<Omit<BizProfile, 'grade' | 'gradeSource' | 'gradeConfirmedBy' | 'gradeConfirmedAt' | 'estimatedRevenue' | 'revenueYear' | 'niceLookedUpAt'> | null>(null);
  const [gradeConfirmed, setGradeConfirmed] = useState(false);
  // eslint-disable-next-line react-hooks/purity
  const minDate = useMemo(() => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10), []);

  const canSend =
    draft.bizProfile !== null &&
    gradeConfirmed &&
    draft.title.trim() !== '' &&
    draft.allowedPgEmails.length > 0 &&
    draft.deadline !== '';

  const handleGradeConfirm = (result: {
    grade: BizProfile['grade'];
    gradeSource: BizProfile['gradeSource'];
    estimatedRevenue?: number;
    revenueYear?: string;
  }) => {
    if (!baseProfile) return;
    draft.setBizProfile({
      ...baseProfile,
      grade: result.grade,
      gradeSource: result.gradeSource,
      estimatedRevenue: result.estimatedRevenue,
      revenueYear: result.revenueYear,
    });
    setGradeConfirmed(true);
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
            onFound={(profile) => {
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
              <GradeConfirmPanel
                bizNo={baseProfile.bizNo}
                onConfirm={handleGradeConfirm}
              />
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
        </div>
      </section>
    </form>
  );
}

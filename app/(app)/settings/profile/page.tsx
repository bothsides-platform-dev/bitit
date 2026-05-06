'use client';

import { useState } from 'react';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Tag } from '@/components/primitives/Tag';
import { Button } from '@/components/primitives/Button';
import { Avatar } from '@/components/primitives/Avatar';
import { PageEnter } from '@/components/primitives/PageEnter';
import { MOCK_SESSION_BUYER, MOCK_WORKSPACES } from '@/lib/mock/workspaces';
import { GRADE_LABELS } from '@/lib/mock/biz-lookup';
import { STATUTORY_CARD_FEE } from '@/lib/types/bid';
import { formatDate } from '@/lib/format';

const AVATAR_COLORS = ['ink', 'accent', 'lavender', 'amber', 'moss', 'terra'] as const;
const AVATAR_COLOR_VAR: Record<typeof AVATAR_COLORS[number], string> = {
  ink: 'var(--color-ink)',
  accent: 'var(--color-accent)',
  lavender: 'var(--color-lavender)',
  amber: 'var(--color-amber)',
  moss: 'var(--color-moss)',
  terra: 'var(--color-terracotta)',
};

export default function ProfilePage() {
  const ws = MOCK_WORKSPACES.find((w) => w.id === MOCK_SESSION_BUYER.workspaceId)!;
  const me = ws.members[0];

  const [name, setName] = useState(me.name);
  const [color, setColor] = useState<typeof AVATAR_COLORS[number]>(me.avatarColor as typeof AVATAR_COLORS[number]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const dirty = name !== me.name || color !== me.avatarColor;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedAt(new Date().toLocaleTimeString('ko-KR'));
  };

  const biz = ws.bizProfile;
  const grade = biz?.grade;
  const cardFee = grade && grade !== 'general' ? STATUTORY_CARD_FEE[grade] : null;

  return (
    <PageEnter className="px-8 py-8 max-w-[720px] space-y-12">
      <div>
        <Eyebrow className="block mb-2">SETTINGS · PROFILE</Eyebrow>
        <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          프로필 설정
        </h1>
      </div>

      {/* User profile (editable) */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Eyebrow>FIG. 01 — 사용자</Eyebrow>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-5">
            <Avatar name={name || me.name} color={color} size="lg" />
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`색상 ${c}`}
                  className={`w-6 h-6 rounded-[var(--r-sm)] transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-[var(--color-ink)] ring-offset-[var(--color-paper)]' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ background: AVATAR_COLOR_VAR[c] }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Eyebrow>이름</Eyebrow>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
            />
          </div>

          <div className="divide-y divide-[var(--color-hair)] border-y border-[var(--color-hair)]">
            {[
              ['이메일', me.email],
              ['역할', me.role.toUpperCase()],
              ['가입일', formatDate(me.joinedAt)],
              ['마지막 접속', me.lastSeenAt ? formatDate(me.lastSeenAt) : '—'],
            ].map(([k, v]) => (
              <div key={k} className="py-2.5 flex items-baseline justify-between">
                <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">{k}</span>
                <span className="text-[13px] text-[var(--color-ink)] font-mono tabular-nums">{v}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!dirty}>
              저장
            </Button>
            {savedAt && (
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-moss)]">
                ✓ 저장됨 {savedAt}
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Workspace info (read-only) */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Eyebrow>FIG. 02 — 워크스페이스</Eyebrow>
          <Tag variant="muted">{ws.type === 'buyer' ? '구매사' : 'PG'}</Tag>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
          {[
            ['이름', ws.name],
            ...(biz ? [
              ['사업자번호', biz.bizNo],
              ['대표자', biz.ceoName],
              ['업태', biz.taxType === 'general' ? '일반과세' : '간이/면세'],
              ...(grade ? ([
                ['가맹점 등급', GRADE_LABELS[grade]],
                ['카드 (법정)', cardFee !== null ? `${(cardFee * 100).toFixed(2)}%` : '카드사별 협의'],
              ] as [string, string][]) : []),
            ] : []),
            ...(ws.domain ? [['도메인', `@${ws.domain}`]] : []),
            ['생성일', formatDate(ws.createdAt)],
          ].map(([k, v]) => (
            <div key={k} className="py-2.5 flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">{k}</span>
              <span className="text-[13px] text-[var(--color-ink)] font-mono tabular-nums">{v}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
          워크스페이스 정보는 사업자등록 자동 갱신을 따릅니다.
        </p>
      </section>
    </PageEnter>
  );
}

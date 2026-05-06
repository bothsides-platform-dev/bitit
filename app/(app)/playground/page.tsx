'use client';

import { Button } from '@/components/primitives/Button';
import { IconButton } from '@/components/primitives/IconButton';
import { Tag } from '@/components/primitives/Tag';
import { Avatar } from '@/components/primitives/Avatar';
import { RoleBadge } from '@/components/primitives/RoleBadge';
import { Chip } from '@/components/primitives/Chip';
import { Tabs } from '@/components/primitives/Tabs';
import { EmptyState } from '@/components/primitives/EmptyState';
import { KpiCell } from '@/components/primitives/KpiCell';
import { Serial } from '@/components/primitives/Serial';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { DataTable } from '@/components/primitives/DataTable';
import { BellIcon, SearchIcon, PlusIcon, FileTextIcon } from '@/components/icons';
import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

type SampleRow = { id: string; name: string; amount: string; status: string };
const COLS: ColumnDef<SampleRow>[] = [
  { accessorKey: 'id', header: '번호' },
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'amount', header: '금액' },
  { accessorKey: 'status', header: '상태' },
];
const ROWS: SampleRow[] = [
  { id: 'Q-2605-0001', name: '토스페이먼츠', amount: '1,200,000원', status: '제출됨' },
  { id: 'Q-2605-0002', name: 'KG이니시스', amount: '980,000원', status: '제출됨' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Eyebrow>{title}</Eyebrow>
        <div className="flex-1 h-px bg-[var(--color-hair)]" />
      </div>
      {children}
    </section>
  );
}

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [activeChip, setActiveChip] = useState('');

  return (
    <div className="px-8 py-10 max-w-[960px] space-y-14">
      <div>
        <Serial current={1} total={1} label="PLAYGROUND" className="block mb-2" />
        <h1 className="text-[36px] font-[800] tracking-[-0.034em] text-[var(--color-ink)]">
          컴포넌트 쇼케이스
        </h1>
        <p className="text-[13px] text-[var(--color-ink-muted)] mt-2">M1 — 공통 컴포넌트 12종</p>
      </div>

      {/* 1. Tag */}
      <Section title="01 · TAG — 상태 태그">
        <div className="flex items-center flex-wrap gap-4">
          <Tag>기본</Tag>
          <Tag variant="amber">발송됨</Tag>
          <Tag variant="moss">수주</Tag>
          <Tag variant="terracotta">만료</Tag>
          <Tag variant="lavender">검토 중</Tag>
          <Tag variant="muted">취소</Tag>
        </div>
      </Section>

      {/* 2. Button */}
      <Section title="02 · BUTTON">
        <div className="flex items-center flex-wrap gap-3">
          <Button variant="primary">주요 액션</Button>
          <Button variant="secondary">보조 액션</Button>
          <Button variant="ghost">고스트</Button>
          <Button variant="danger">위험</Button>
          <Button variant="primary" size="sm">소형</Button>
          <Button variant="primary" size="lg">대형</Button>
          <Button variant="primary" disabled>비활성</Button>
        </div>
      </Section>

      {/* 3. IconButton */}
      <Section title="03 · ICON BUTTON">
        <div className="flex items-center gap-2">
          <IconButton label="알림"><BellIcon size={18} /></IconButton>
          <IconButton label="검색"><SearchIcon size={18} /></IconButton>
          <IconButton label="추가" active><PlusIcon size={18} /></IconButton>
        </div>
      </Section>

      {/* 4. Avatar */}
      <Section title="04 · AVATAR">
        <div className="flex items-center gap-3">
          <Avatar name="이성연" color="accent" size="sm" />
          <Avatar name="김토스" color="lavender" size="md" />
          <Avatar name="박이니시스" color="moss" size="lg" />
          <Avatar name="최카카오" color="amber" size="md" />
        </div>
      </Section>

      {/* 5. RoleBadge */}
      <Section title="05 · ROLE BADGE">
        <div className="flex items-center gap-4">
          <RoleBadge role="admin" />
          <RoleBadge role="member" />
        </div>
      </Section>

      {/* 6. Chip */}
      <Section title="06 · CHIP — 필터">
        <div className="flex items-center flex-wrap gap-2">
          {['전체', '발송됨', '수주', '마감'].map((label) => (
            <Chip
              key={label}
              active={activeChip === label}
              onClick={() => setActiveChip(activeChip === label ? '' : label)}
            >
              {label}
            </Chip>
          ))}
        </div>
      </Section>

      {/* 7. Tabs */}
      <Section title="07 · TABS">
        <Tabs
          tabs={[
            { id: 'all', label: '전체', count: 12 },
            { id: 'sent', label: '발송됨', count: 4 },
            { id: 'awarded', label: '수주', count: 2 },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
        <p className="text-[12px] text-[var(--color-ink-soft)] px-1">활성 탭: {activeTab}</p>
      </Section>

      {/* 8. Serial + Eyebrow */}
      <Section title="08 · SERIAL + EYEBROW — 편집 마킹">
        <div className="space-y-3">
          <Serial current={3} total={14} label="EMAIL" />
          <br />
          <Serial current={1} total={4} />
          <br />
          <Eyebrow>FIG. 03 — 비교 테이블</Eyebrow>
          <br />
        </div>
      </Section>

      {/* 9. KpiCell */}
      <Section title="09 · KPI CELL — 거대 숫자">
        <div className="flex items-start gap-16">
          <KpiCell
            label="진행 중인 견적"
            serial="A"
            value="3"
            delta={{ direction: 'up', text: '전월 대비 +2' }}
          />
          <KpiCell
            label="수주 완료"
            serial="B"
            value="1"
            delta={{ direction: 'flat', text: '변동 없음' }}
          />
        </div>
      </Section>

      {/* 10. EmptyState */}
      <Section title="10 · EMPTY STATE">
        <div className="border border-[var(--color-hair)] rounded-[var(--r)]">
          <EmptyState
            icon={<FileTextIcon size={28} />}
            title="데이터가 없습니다."
            description="조건에 맞는 항목이 없습니다."
            action={<Button size="sm" variant="secondary">새로 만들기</Button>}
          />
        </div>
      </Section>

      {/* 11. DataTable */}
      <Section title="11 · DATA TABLE — 헤어라인 테이블">
        <DataTable columns={COLS} data={ROWS} onRowClick={(r) => alert(r.id)} />
        <p className="text-[11px] text-[var(--color-ink-soft)] font-mono mt-2">
          ← 행 클릭 시 마커 + warm 배경
        </p>
      </Section>

      {/* 12. PermissionGate — shown statically */}
      <Section title="12 · PERMISSION GATE">
        <div className="flex items-center gap-4">
          <Tag variant="moss">admin 이상 — 보임</Tag>
          <Tag variant="muted">member 전용 영역 — admin은 숨김</Tag>
        </div>
        <p className="text-[12px] text-[var(--color-ink-soft)]">
          {'<PermissionGate role="member" requiredRole="admin">'}로 감싸면 member에게 hidden
        </p>
      </Section>

      <div className="pt-8 border-t border-[var(--color-hair)]">
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-faint)] text-center">
          — FIN — M1 PRIMITIVES
        </p>
      </div>
    </div>
  );
}

'use client';

import { Button } from '@/components/primitives/Button';
import { IconButton } from '@/components/primitives/IconButton';
import { Chip } from '@/components/primitives/Chip';
import { Avatar } from '@/components/primitives/Avatar';
import { Tabs } from '@/components/primitives/Tabs';
import { EmptyState } from '@/components/primitives/EmptyState';
import { KpiCell } from '@/components/primitives/KpiCell';
import { Label } from '@/components/primitives/Label';
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
        <Label size="md" muted={false}>{title}</Label>
        <div className="flex-1 h-px bg-[var(--md-sys-color-outline-variant)]" />
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
        <h1 className="text-[36px] font-[800] tracking-[-0.034em] text-[var(--md-sys-color-on-surface)]">
          컴포넌트 쇼케이스
        </h1>
        <p className="text-[13px] text-[var(--md-sys-color-on-surface-variant)] mt-2">M1 — 공통 컴포넌트 12종</p>
      </div>

      {/* 1. Chip (was Tag) */}
      <Section title="01 · CHIP — 상태 태그">
        <div className="flex items-center flex-wrap gap-4">
          <Chip label="기본" color="surface" />
          <Chip label="발송됨" color="warning" />
          <Chip label="수주" color="tertiary" />
          <Chip label="만료" color="error" />
          <Chip label="검토 중" color="surface" />
          <Chip label="취소" color="surface" />
        </div>
      </Section>

      {/* 2. Button */}
      <Section title="02 · BUTTON">
        <div className="flex items-center flex-wrap gap-3">
          <Button variant="filled">주요 액션</Button>
          <Button variant="outlined">보조 액션</Button>
          <Button variant="text">고스트</Button>
          <Button variant="filled" color="error">위험</Button>
          <Button variant="filled" size="sm">소형</Button>
          <Button variant="filled" size="lg">대형</Button>
          <Button variant="filled" disabled>비활성</Button>
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
          <Avatar name="이성연" color="primary" size="sm" />
          <Avatar name="김토스" color="surface" size="md" />
          <Avatar name="박이니시스" color="tertiary" size="lg" />
          <Avatar name="최카카오" color="primary" size="md" />
        </div>
      </Section>

      {/* 5. Chip (was RoleBadge) */}
      <Section title="05 · ROLE BADGE">
        <div className="flex items-center gap-4">
          <Chip label="관리자" color="primary" />
          <Chip label="구성원" color="surface" />
        </div>
      </Section>

      {/* 6. Chip */}
      <Section title="06 · CHIP — 필터">
        <div className="flex items-center flex-wrap gap-2">
          {['전체', '발송됨', '수주', '마감'].map((label) => (
            <Chip
              key={label}
              variant="filter"
              label={label}
              selected={activeChip === label}
              onClick={() => setActiveChip(activeChip === label ? '' : label)}
            />
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
        <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] px-1">활성 탭: {activeTab}</p>
      </Section>

      {/* 8. Label */}
      <Section title="08 · LABEL — 편집 마킹">
        <div className="space-y-3">
          <Label size="md" muted={false}>비교 테이블</Label>
          <br />
        </div>
      </Section>

      {/* 9. KpiCell */}
      <Section title="09 · KPI CELL — 거대 숫자">
        <div className="flex items-start gap-16">
          <KpiCell
            label="진행 중인 견적"
            value="3"
            delta={{ direction: 'up', text: '전월 대비 +2' }}
          />
          <KpiCell
            label="수주 완료"
            value="1"
            delta={{ direction: 'neutral', text: '변동 없음' }}
          />
        </div>
      </Section>

      {/* 10. EmptyState */}
      <Section title="10 · EMPTY STATE">
        <div className="border border-[var(--md-sys-color-outline-variant)] rounded-md">
          <EmptyState
            icon={<FileTextIcon size={28} />}
            title="데이터가 없습니다."
            description="조건에 맞는 항목이 없습니다."
            action={<Button size="sm" variant="outlined">새로 만들기</Button>}
          />
        </div>
      </Section>

      {/* 11. DataTable */}
      <Section title="11 · DATA TABLE — 헤어라인 테이블">
        <DataTable columns={COLS} data={ROWS} onRowClick={(r) => alert(r.id)} />
        <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-mono mt-2">
          ← 행 클릭 시 마커 + warm 배경
        </p>
      </Section>

      {/* 12. PermissionGate — shown statically */}
      <Section title="12 · PERMISSION GATE">
        <div className="flex items-center gap-4">
          <Chip label="admin 이상 — 보임" color="tertiary" />
          <Chip label="member 전용 영역 — admin은 숨김" color="surface" />
        </div>
        <p className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
          {'<PermissionGate role="member" requiredRole="admin">'}로 감싸면 member에게 hidden
        </p>
      </Section>

    </div>
  );
}

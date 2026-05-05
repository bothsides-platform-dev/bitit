import { Eyebrow } from '@/components/primitives/Eyebrow';

export default function MembersPage() {
  return (
    <div className="px-8 py-8">
      <Eyebrow className="block mb-2">SETTINGS · MEMBERS</Eyebrow>
      <h1 className="text-[20px] font-[700] tracking-[-0.02em] text-[var(--color-ink)] mb-8">
        멤버 관리
      </h1>
      <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
        M6 마일스톤 구현 예정
      </p>
    </div>
  );
}

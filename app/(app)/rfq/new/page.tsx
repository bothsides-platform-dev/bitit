import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Serial } from '@/components/primitives/Serial';

export default function RfqNewPage() {
  return (
    <div className="px-8 py-8 max-w-[820px]">
      <div className="mb-8">
        <Serial current={1} total={4} label="BASIC" className="block mb-2" />
        <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          신규 견적 요청
        </h1>
      </div>

      <div className="space-y-10">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">01 사업자 정보</span>
            <div className="flex-1 h-px bg-[var(--color-hair)]" />
          </div>
          <div className="space-y-1">
            <Eyebrow>사업자 등록번호</Eyebrow>
            <input
              type="text"
              placeholder="000-00-00000"
              className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] font-mono tabular-nums text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
            />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">02 견적 내용</span>
            <div className="flex-1 h-px bg-[var(--color-hair)]" />
          </div>
          <div className="space-y-5">
            <div className="space-y-1">
              <Eyebrow>제목</Eyebrow>
              <input
                type="text"
                className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
              />
            </div>
            <div className="space-y-1">
              <Eyebrow>메모</Eyebrow>
              <textarea
                rows={3}
                className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors resize-none"
              />
            </div>
          </div>
        </section>

        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">
          M2 마일스톤에서 구현 예정 — RFQ 폼 전체
        </p>
      </div>
    </div>
  );
}

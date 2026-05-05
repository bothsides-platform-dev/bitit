import { Serial } from '@/components/primitives/Serial';
import { RfqCreateForm } from '@/components/rfq/RfqCreateForm';

export default function RfqNewPage() {
  return (
    <div className="px-8 py-8 max-w-[820px]">
      <div className="mb-10">
        <Serial current={1} total={4} label="RFQ" className="block mb-3" />
        <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          신규 견적 요청
        </h1>
      </div>
      <RfqCreateForm />
    </div>
  );
}

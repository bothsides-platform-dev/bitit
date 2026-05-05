type Props = { params: Promise<{ rfqId: string }> };

export default async function InboxDetailPage({ params }: Props) {
  const { rfqId } = await params;
  return (
    <div className="px-8 py-8">
      <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
        PG 견적 응답 — {rfqId} · M3 마일스톤 구현 예정
      </p>
    </div>
  );
}

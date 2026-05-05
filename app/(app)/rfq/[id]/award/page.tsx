type Props = { params: Promise<{ id: string }> };

export default async function AwardPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="px-8 py-8">
      <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
        수주 처리 — {id} · M5 마일스톤 구현 예정
      </p>
    </div>
  );
}

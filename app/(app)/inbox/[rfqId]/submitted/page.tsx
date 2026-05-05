type Props = { params: Promise<{ rfqId: string }> };

export default async function SubmittedPage({ params }: Props) {
  const { rfqId } = await params;
  return (
    <div className="px-8 py-8">
      <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
        제출 완료 — {rfqId}
      </p>
    </div>
  );
}

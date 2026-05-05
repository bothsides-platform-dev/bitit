type Props = { params: Promise<{ token: string }> };

export default async function InviteRfqPage({ params }: Props) {
  const { token } = await params;
  return (
    <div className="py-8 text-[13px] text-[var(--color-ink-muted)]">
      초대 토큰 진입 — {token}
    </div>
  );
}

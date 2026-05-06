import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Tag } from '@/components/primitives/Tag';
import { Button } from '@/components/primitives/Button';
import { EmptyState } from '@/components/primitives/EmptyState';
import { PageEnter } from '@/components/primitives/PageEnter';
import { FileTextIcon } from '@/components/icons';
import { auth } from '@/auth';
import { getRfqRepo, getUserRepo } from '@/lib/server/repositories/factory';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?next=/home');

  // PG 멤버는 inbox로 보내는 게 맞지만 본 페이지에서는 buyer 우선 시각만
  // 대응. PG라면 inbox 단순 alias 형태로 반환. (Step 8/12에서 통합 정리 예정)
  if (session.user.workspaceType !== 'buyer' || !session.user.workspaceId) {
    redirect('/inbox');
  }

  const rfqs = await (await getRfqRepo()).findByBuyerWs(session.user.workspaceId);
  const sentRfqs = rfqs.filter((r) => r.status === 'sent');

  // 디스플레이 이름 (Topbar는 별도). hydrate 비용 최소화 위해 user repo 1회.
  const userRepo = await getUserRepo();
  const me = await userRepo.findById(session.user.id);
  const displayName = me?.name ?? session.user.email ?? '사용자';

  const today = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '.');

  return (
    <PageEnter className="px-8 py-10 max-w-[var(--content-max)]">
      {/* Greeting */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Eyebrow>BIDIT · BUYER DASHBOARD</Eyebrow>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
          <Eyebrow>{today}</Eyebrow>
        </div>
        <h1 className="text-[52px] font-[800] tracking-[-0.034em] leading-[1.1] text-[var(--color-ink)]">
          안녕하세요, <span>{displayName}</span>
          <span className="font-[200]"> — 님.</span>
        </h1>
      </div>

      {/* Active RFQs */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Eyebrow>진행 중인 견적</Eyebrow>
          <span className="font-mono tabular-nums text-[11px] text-[var(--color-ink-soft)]">
            {sentRfqs.length}건
          </span>
        </div>
        {sentRfqs.length === 0 ? (
          <EmptyState
            icon={<FileTextIcon size={32} />}
            title="진행 중인 견적이 없습니다."
            description="새로운 견적을 작성해 PG사에 발송하세요."
            action={
              <Link href="/rfq/new">
                <Button size="sm">+ 신규 견적</Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
            {sentRfqs.map((rfq) => (
              <Link
                key={rfq.id}
                href={`/rfq/${rfq.id}`}
                className="py-4 flex items-center justify-between group hover:bg-[var(--color-paper-warm)] -mx-4 px-4 cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-ink)]">
                    {rfq.title}
                  </p>
                  <span className="font-mono text-[11px] text-[var(--color-ink-soft)] tabular-nums">
                    {rfq.id} · {formatDate(rfq.sentAt ?? rfq.createdAt)}
                  </span>
                </div>
                <Tag variant="amber">발송됨</Tag>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageEnter>
  );
}

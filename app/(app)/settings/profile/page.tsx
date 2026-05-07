import { redirect } from 'next/navigation';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Tag } from '@/components/primitives/Tag';
import { Avatar } from '@/components/primitives/Avatar';
import { PageEnter } from '@/components/primitives/PageEnter';
import { WorkspaceBizProfileForm } from '@/components/settings/WorkspaceBizProfileForm';
import { WorkspaceBizNoForm } from '@/components/settings/WorkspaceBizNoForm';
import { WorkspaceNameForm } from '@/components/settings/WorkspaceNameForm';
import { BizRequiredToast } from '@/components/settings/BizRequiredToast';
import { auth } from '@/auth';
import {
  getUserRepo,
  getWorkspaceRepo,
} from '@/lib/server/repositories/factory';
import { STATUTORY_CARD_FEE } from '@/lib/types/bid';
import { formatDate } from '@/lib/format';
import { GRADE_LABELS } from '@/lib/types/biz-profile';

export const dynamic = 'force-dynamic';

const VALID_AVATAR = ['ink', 'accent', 'lavender', 'amber', 'moss', 'terra'] as const;

type Props = { searchParams: Promise<{ biz_required?: string }> };

export default async function ProfilePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id || !session.user.workspaceId) {
    redirect('/login?next=/settings/profile');
  }

  const { biz_required } = await searchParams;
  const userRepo = await getUserRepo();
  const wsRepo = await getWorkspaceRepo();
  const me = await userRepo.findById(session.user.id);
  const ws = await wsRepo.findById(session.user.workspaceId);
  if (!me || !ws) {
    return (
      <div className="px-4 py-8 md:px-8 md:py-12">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]">
          프로필 정보를 불러오지 못했습니다.
        </p>
      </div>
    );
  }

  const biz = ws.bizProfile;
  const grade = biz?.grade;
  const cardFee = grade && grade !== 'general' ? STATUTORY_CARD_FEE[grade] : null;
  const memberMeta = ws.members.find((m) => m.id === me.id);

  const wsKvPairs: [string, string][] = [
    ...(biz
      ? ([
          [
            '업태',
            biz.taxType === 'general'
              ? '일반과세'
              : biz.taxType === 'simple'
                ? '간이과세'
                : '면세',
          ],
          ...(grade
            ? ([
                ['가맹점 등급', GRADE_LABELS[grade]],
                [
                  '카드 (법정)',
                  cardFee !== null
                    ? `${(cardFee * 100).toFixed(2)}%`
                    : '카드사별 협의',
                ],
              ] as [string, string][])
            : []),
        ] as [string, string][])
      : []),
    ...(ws.domain ? ([['도메인', `@${ws.domain}`]] as [string, string][]) : []),
    ['생성일', formatDate(ws.createdAt)],
  ];

  const kvRowClass =
    'py-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4';
  const kvLabelClass =
    'font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]';
  const kvValueClass =
    'text-[13px] text-[var(--color-ink)] font-mono tabular-nums break-all sm:break-normal';

  return (
    <PageEnter className="px-4 py-6 md:px-8 md:py-8 space-y-8 md:space-y-10">
      <div>
        <Eyebrow className="block mb-2">SETTINGS · PROFILE</Eyebrow>
        <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          프로필 설정
        </h1>
      </div>

      {/* User profile (read-only for now — name/avatar editing is M9 surface) */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <Eyebrow>사용자</Eyebrow>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <div className="flex items-center gap-4 mb-3">
          <Avatar
            name={me.name}
            color={
              VALID_AVATAR.includes(
                me.avatarColor as (typeof VALID_AVATAR)[number],
              )
                ? (me.avatarColor as (typeof VALID_AVATAR)[number])
                : 'ink'
            }
            size="lg"
          />
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-[var(--color-ink)]">{me.name}</p>
            <p className="font-mono text-[11px] tabular-nums text-[var(--color-ink-soft)] break-all">
              {me.email}
            </p>
          </div>
        </div>
        <div className="divide-y divide-[var(--color-hair)] border-y border-[var(--color-hair)]">
          {[
            ['이메일', me.email],
            ['역할', me.role.toUpperCase()],
            ['가입일', formatDate(memberMeta?.joinedAt ?? me.joinedAt)],
          ].map(([k, v]) => (
            <div key={k} className={kvRowClass}>
              <span className={kvLabelClass}>{k}</span>
              <span className={kvValueClass}>{v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Workspace + biz profile */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <Eyebrow>워크스페이스</Eyebrow>
          <Tag variant="muted">{ws.type === 'buyer' ? '구매사' : 'PG'}</Tag>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>

        <div
          className={
            ws.type === 'buyer'
              ? 'grid grid-cols-1 lg:grid-cols-2 lg:gap-x-12'
              : ''
          }
        >
          {/* Left: meta KV (이름 폼 포함) */}
          <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
            <WorkspaceNameForm
              currentName={ws.name}
              canEdit={me.role === 'admin'}
            />
            {wsKvPairs.map(([k, v]) => (
              <div key={k} className={kvRowClass}>
                <span className={kvLabelClass}>{k}</span>
                <span className={kvValueClass}>{v}</span>
              </div>
            ))}
          </div>

          {/* Right: 사업자번호/등급 폼 (buyer only) */}
          {ws.type === 'buyer' && (
            <div className="mt-6 pt-6 border-t border-[var(--color-hair)] space-y-6 lg:mt-0 lg:pt-0 lg:border-t-0 lg:space-y-8">
              {biz_required === '1' && !biz && (
                <>
                  <BizRequiredToast />
                  <p
                    role="alert"
                    className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--color-terracotta)]"
                  >
                    견적 생성을 위해 사업자번호 등록이 필요합니다.
                  </p>
                </>
              )}
              <WorkspaceBizNoForm
                currentBizNo={biz?.bizNo ?? null}
                returnUrl={biz_required === '1' && !biz ? '/rfq/new' : undefined}
              />
              {biz && <WorkspaceBizProfileForm currentGrade={grade} />}
            </div>
          )}
        </div>
      </section>
    </PageEnter>
  );
}

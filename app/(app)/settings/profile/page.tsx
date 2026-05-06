import { redirect } from 'next/navigation';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Tag } from '@/components/primitives/Tag';
import { Avatar } from '@/components/primitives/Avatar';
import { PageEnter } from '@/components/primitives/PageEnter';
import { WorkspaceBizProfileForm } from '@/components/settings/WorkspaceBizProfileForm';
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

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.workspaceId) {
    redirect('/login?next=/settings/profile');
  }

  const userRepo = await getUserRepo();
  const wsRepo = await getWorkspaceRepo();
  const me = await userRepo.findById(session.user.id);
  const ws = await wsRepo.findById(session.user.workspaceId);
  if (!me || !ws) {
    return (
      <div className="px-8 py-12 max-w-[640px]">
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

  return (
    <PageEnter className="px-8 py-8 max-w-[720px] space-y-12">
      <div>
        <Eyebrow className="block mb-2">SETTINGS · PROFILE</Eyebrow>
        <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          프로필 설정
        </h1>
      </div>

      {/* User profile (read-only for now — name/avatar editing is M9 surface) */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Eyebrow>FIG. 01 — 사용자</Eyebrow>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <div className="flex items-center gap-5 mb-4">
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
          <div>
            <p className="text-[14px] font-medium text-[var(--color-ink)]">{me.name}</p>
            <p className="font-mono text-[11px] tabular-nums text-[var(--color-ink-soft)]">
              {me.email}
            </p>
          </div>
        </div>
        <div className="divide-y divide-[var(--color-hair)] border-y border-[var(--color-hair)]">
          {[
            ['이메일', me.email],
            ['역할', me.role.toUpperCase()],
            ['가입일', formatDate(memberMeta?.joinedAt ?? me.joinedAt)],
            [
              '마지막 접속',
              memberMeta?.lastSeenAt ? formatDate(memberMeta.lastSeenAt) : '—',
            ],
          ].map(([k, v]) => (
            <div
              key={k}
              className="py-2.5 flex items-baseline justify-between"
            >
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">
                {k}
              </span>
              <span className="text-[13px] text-[var(--color-ink)] font-mono tabular-nums">
                {v}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Workspace + biz profile */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Eyebrow>FIG. 02 — 워크스페이스</Eyebrow>
          <Tag variant="muted">{ws.type === 'buyer' ? '구매사' : 'PG'}</Tag>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <div className="divide-y divide-[var(--color-hair)] border-t border-[var(--color-hair)]">
          {[
            ['이름', ws.name],
            ...(biz
              ? ([
                  ['사업자번호', biz.bizNo],
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
          ].map(([k, v]) => (
            <div
              key={k}
              className="py-2.5 flex items-baseline justify-between"
            >
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)]">
                {k}
              </span>
              <span className="text-[13px] text-[var(--color-ink)] font-mono tabular-nums">
                {v}
              </span>
            </div>
          ))}
        </div>
        {ws.type === 'buyer' && (
          <div className="mt-6 border-t border-[var(--color-hair)] pt-6">
            <WorkspaceBizProfileForm currentGrade={grade} />
          </div>
        )}
      </section>
    </PageEnter>
  );
}

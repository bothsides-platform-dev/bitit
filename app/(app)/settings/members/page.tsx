'use client';

import { useState } from 'react';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Button } from '@/components/primitives/Button';
import { Avatar } from '@/components/primitives/Avatar';
import { RoleBadge } from '@/components/primitives/RoleBadge';
import { Tag } from '@/components/primitives/Tag';
import { PageEnter } from '@/components/primitives/PageEnter';
import { MOCK_SESSION_BUYER, MOCK_WORKSPACES } from '@/lib/mock/workspaces';
import { formatDate } from '@/lib/format';
import type { User, Role } from '@/lib/types/user';

const COLORS: User['avatarColor'][] = ['lavender', 'amber', 'moss', 'accent', 'terra', 'ink'];

export default function MembersPage() {
  const ws = MOCK_WORKSPACES.find((w) => w.id === MOCK_SESSION_BUYER.workspaceId)!;
  const [members, setMembers] = useState<User[]>(ws.members);
  const [pendingInvites, setPendingInvites] = useState<{ email: string; role: Role; invitedAt: string }[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  const [error, setError] = useState<string | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('이메일 형식이 올바르지 않습니다.');
      return;
    }
    if (members.some((m) => m.email === email) || pendingInvites.some((p) => p.email === email)) {
      setError('이미 등록되었거나 초대 대기 중인 이메일입니다.');
      return;
    }

    setPendingInvites((prev) => [
      ...prev,
      { email, role: inviteRole, invitedAt: new Date().toISOString() },
    ]);
    setInviteEmail('');
    setInviteRole('member');
  };

  const handleCancelInvite = (email: string) => {
    setPendingInvites((prev) => prev.filter((p) => p.email !== email));
  };

  const handleRoleToggle = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: m.role === 'admin' ? 'member' : 'admin' } : m)),
    );
  };

  return (
    <PageEnter className="px-8 py-8 max-w-[840px] space-y-12">
      <div>
        <Eyebrow className="block mb-2">SETTINGS · MEMBERS</Eyebrow>
        <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          멤버 관리
        </h1>
        <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
          {ws.name} 워크스페이스의 멤버 {members.length}명
          {pendingInvites.length > 0 && ` · 초대 대기 ${pendingInvites.length}건`}
        </p>
      </div>

      {/* Members list */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Eyebrow>FIG. 01 — 활성 멤버</Eyebrow>
          <span className="font-mono tabular-nums text-[11px] text-[var(--color-ink-soft)]">
            {String(members.length).padStart(2, '0')}
          </span>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <div className="divide-y divide-[var(--color-hair)] border-y border-[var(--color-hair)]">
          {members.map((m) => (
            <div key={m.id} className="py-4 flex items-center gap-4 hover:bg-[var(--color-paper-warm)] -mx-4 px-4 transition-colors">
              <Avatar name={m.name} color={m.avatarColor} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--color-ink)]">{m.name}</p>
                <span className="font-mono text-[11px] text-[var(--color-ink-soft)] tabular-nums">{m.email}</span>
              </div>
              <span className="font-mono text-[10px] tabular-nums text-[var(--color-ink-faint)] hidden md:inline">
                {m.lastSeenAt ? formatDate(m.lastSeenAt) : '—'}
              </span>
              <RoleBadge role={m.role} />
              <button
                type="button"
                onClick={() => handleRoleToggle(m.id)}
                className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
              >
                {m.role === 'admin' ? '→ 멤버' : '→ 관리자'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Eyebrow>FIG. 02 — 초대 대기</Eyebrow>
            <span className="font-mono tabular-nums text-[11px] text-[var(--color-amber)]">
              {String(pendingInvites.length).padStart(2, '0')}
            </span>
            <div className="flex-1 h-px bg-[var(--color-hair)]" />
          </div>
          <div className="divide-y divide-[var(--color-hair)] border-y border-[var(--color-hair)]">
            {pendingInvites.map((p, i) => (
              <div key={p.email} className="py-3 flex items-center gap-4">
                <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-faint)] w-8">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[13px] tabular-nums text-[var(--color-ink)]">{p.email}</span>
                </div>
                <RoleBadge role={p.role} />
                <Tag variant="amber">대기중</Tag>
                <button
                  type="button"
                  onClick={() => handleCancelInvite(p.email)}
                  className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] hover:text-[var(--color-terracotta)] transition-colors"
                >
                  취소
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invite form */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Eyebrow>FIG. {pendingInvites.length > 0 ? '03' : '02'} — 멤버 초대</Eyebrow>
          <div className="flex-1 h-px bg-[var(--color-hair)]" />
        </div>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 space-y-1">
              <Eyebrow>이메일</Eyebrow>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@company.com"
                className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] font-mono tabular-nums text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
              />
            </div>
            <div className="space-y-1 md:w-32">
              <Eyebrow>역할</Eyebrow>
              <div className="flex gap-2">
                {(['admin', 'member'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setInviteRole(r)}
                    className={`flex-1 h-10 px-3 font-mono text-[11px] tracking-[0.1em] uppercase transition-colors ${
                      inviteRole === r
                        ? 'border border-[var(--color-ink)] text-[var(--color-ink)]'
                        : 'border border-[var(--color-hair)] text-[var(--color-ink-soft)] hover:border-[var(--color-hair-strong)]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={!inviteEmail.trim()}>
              초대 발송
            </Button>
          </div>
          {error && (
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-terracotta)]">
              {error}
            </p>
          )}
          <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--color-ink-faint)]">
            초대 메일이 발송되며, 수락 후 멤버 목록에 추가됩니다.
          </p>
        </form>
      </section>

      {/* Avatar swatches preview (decorative) */}
      <section className="pt-6 border-t border-[var(--color-hair)]">
        <Eyebrow className="block mb-3">아바타 색상 팔레트</Eyebrow>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <Avatar key={c} name={c.toUpperCase()} color={c} size="sm" />
          ))}
        </div>
      </section>
    </PageEnter>
  );
}

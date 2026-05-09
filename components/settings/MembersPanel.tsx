'use client';

/**
 * MembersPanel — Members 페이지의 인터랙티브 부분.
 * 부모(settings/members/page.tsx)는 RSC에서 auth() + getWorkspaceRepo().findById로
 * 워크스페이스 + 멤버를 hydrate해 props로 내려준다. v0 단계에서는 초대 발송/
 * 역할 토글 모두 클라이언트 로컬 상태로만 처리(서버 액션 미구현 — 후속 마일스톤).
 */
import { useState } from 'react';
import { Avatar } from '@/components/primitives/Avatar';
import { Label } from '@/components/primitives/Label';
import { Button } from '@/components/primitives/Button';
import { Chip } from '@/components/primitives/Chip';
import { formatDate } from '@/lib/format';
import type { User } from '@/lib/types/user';

type Props = {
  workspaceName: string;
  initialMembers: User[];
};

export function MembersPanel({ workspaceName, initialMembers }: Props) {
  const [members] = useState<User[]>(initialMembers);
  const [pendingInvites, setPendingInvites] = useState<{ email: string; invitedAt: string }[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
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
      { email, invitedAt: new Date().toISOString() },
    ]);
    setInviteEmail('');
  };

  const handleCancelInvite = (email: string) => {
    setPendingInvites((prev) => prev.filter((p) => p.email !== email));
  };

  return (
    <>
      <div>
        <Label size="md" muted={false} as="span" className="block mb-2">SETTINGS · MEMBERS</Label>
        <h1 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]">
          멤버 관리
        </h1>
        <p className="mt-2 text-[13px] text-[var(--md-sys-color-on-surface-variant)]">
          {workspaceName} 워크스페이스의 멤버 {members.length}명
          {pendingInvites.length > 0 && ` · 초대 대기 ${pendingInvites.length}건`}
        </p>
      </div>

      {/* Members list */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Label size="md" muted={false}>활성 멤버</Label>
          <span className="font-mono tabular-nums text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            {String(members.length).padStart(2, '0')}
          </span>
          <div className="flex-1 h-px bg-[var(--md-sys-color-outline-variant)]" />
        </div>
        <div className="divide-y divide-[var(--md-sys-color-outline-variant)] border-y border-[var(--md-sys-color-outline-variant)]">
          {members.map((m) => (
            <div key={m.id} className="py-4 flex items-center gap-4 hover:bg-[var(--md-sys-color-surface-container-high)] -mx-4 px-4 transition-colors">
              <Avatar name={m.name} color="primary" size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--md-sys-color-on-surface)]">{m.name}</p>
                <span className="font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)] tabular-nums">{m.email}</span>
              </div>
              <span className="font-mono text-[10px] tabular-nums text-[var(--md-sys-color-outline)] hidden md:inline">
                {m.lastSeenAt ? formatDate(m.lastSeenAt) : '—'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Label size="md" muted={false}>초대 대기</Label>
            <span className="font-mono tabular-nums text-[11px] text-[var(--md-sys-color-warning)]">
              {String(pendingInvites.length).padStart(2, '0')}
            </span>
            <div className="flex-1 h-px bg-[var(--md-sys-color-outline-variant)]" />
          </div>
          <div className="divide-y divide-[var(--md-sys-color-outline-variant)] border-y border-[var(--md-sys-color-outline-variant)]">
            {pendingInvites.map((p, i) => (
              <div key={p.email} className="py-3 flex items-center gap-4">
                <span className="font-mono text-[11px] tabular-nums text-[var(--md-sys-color-outline)] w-8">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[13px] tabular-nums text-[var(--md-sys-color-on-surface)]">{p.email}</span>
                </div>
                <Chip label="대기중" color="warning" />
                <button
                  type="button"
                  onClick={() => handleCancelInvite(p.email)}
                  className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] transition-colors"
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
          <Label size="md" muted={false}>멤버 초대</Label>
          <div className="flex-1 h-px bg-[var(--md-sys-color-outline-variant)]" />
        </div>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 space-y-1">
              <Label size="md" muted={false}>이메일</Label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@company.com"
                className="block w-full bg-transparent border-0 border-b border-[var(--md-sys-color-outline)] py-2 text-[14px] font-mono tabular-nums text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-outline)] focus:outline-none focus:border-[var(--md-sys-color-on-surface)] transition-colors"
              />
            </div>
            <Button type="submit" disabled={!inviteEmail.trim()} className="md:ml-4">
              초대 발송
            </Button>
          </div>
          {error && (
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--md-sys-color-error)]">
              {error}
            </p>
          )}
          <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--md-sys-color-outline)]">
            초대 메일이 발송되며, 수락 후 멤버 목록에 추가됩니다.
          </p>
        </form>
      </section>

    </>
  );
}

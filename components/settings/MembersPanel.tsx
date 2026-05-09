'use client';

import { useState, useTransition } from 'react';
import { Avatar } from '@/components/primitives/Avatar';
import { Label } from '@/components/primitives/Label';
import { Button } from '@/components/primitives/Button';
import { Chip } from '@/components/primitives/Chip';
import { formatDate } from '@/lib/format';
import { inviteWorkspaceMemberAction } from '@/lib/server/actions/workspace/inviteWorkspaceMemberAction';
import type { User } from '@/lib/types/user';

type PendingInvite = { email: string; createdAt: string };

type Props = {
  workspaceName: string;
  initialMembers: User[];
  userRole: 'admin' | 'member';
  initialPendingInvites: PendingInvite[];
};

export function MembersPanel({ workspaceName, initialMembers, userRole, initialPendingInvites }: Props) {
  const [members] = useState<User[]>(initialMembers);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>(initialPendingInvites);
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('이메일 형식이 올바르지 않습니다.');
      return;
    }

    startTransition(async () => {
      const result = await inviteWorkspaceMemberAction({ email });
      if (!result.ok) {
        if (result.error === 'ALREADY_INVITED') {
          setError('이미 초대 대기 중인 이메일입니다.');
        } else if (result.error === 'FORBIDDEN_NOT_ADMIN') {
          setError('초대 권한이 없습니다.');
        } else {
          setError(`초대 실패 (${result.error})`);
        }
        return;
      }
      setPendingInvites((prev) => [
        ...prev,
        { email, createdAt: new Date().toISOString() },
      ]);
      setInviteEmail('');
    });
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
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invite form — admin only */}
      {userRole === 'admin' && (
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
                  disabled={isPending}
                  onChange={(e) => { setInviteEmail(e.target.value); setError(null); }}
                  placeholder="member@company.com"
                  className="block w-full bg-transparent border-0 border-b border-[var(--md-sys-color-outline)] py-2 text-[14px] font-mono tabular-nums text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-outline)] focus:outline-none focus:border-[var(--md-sys-color-on-surface)] transition-colors disabled:opacity-50"
                />
              </div>
              <Button type="submit" disabled={!inviteEmail.trim() || isPending} className="md:ml-4">
                {isPending ? '발송 중…' : '초대 발송'}
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
      )}
    </>
  );
}

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getWorkspaceRepo } from '@/lib/server/repositories/factory';
import { PageEnter } from '@/components/primitives/PageEnter';
import { MembersPanel } from '@/components/settings/MembersPanel';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.workspaceId) {
    redirect('/login?next=/settings/members');
  }

  const ws = await (await getWorkspaceRepo()).findById(session.user.workspaceId);
  if (!ws) {
    return (
      <div className="px-8 py-8">
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--md-sys-color-outline)]">
          워크스페이스를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <PageEnter className="px-4 py-6 md:px-8 md:py-8 space-y-8 md:space-y-10">
      <MembersPanel workspaceName={ws.name} initialMembers={ws.members} />
    </PageEnter>
  );
}

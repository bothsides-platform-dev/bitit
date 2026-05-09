import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { BuyerHome } from '@/components/home/BuyerHome';
import { PgHome } from '@/components/home/PgHome';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?next=/home');

  if (session.user.workspaceType === 'pg' && session.user.workspaceId) {
    return <PgHome workspaceId={session.user.workspaceId} />;
  }

  if (session.user.workspaceType === 'buyer' && session.user.workspaceId) {
    return <BuyerHome workspaceId={session.user.workspaceId} />;
  }

  redirect('/login');
}

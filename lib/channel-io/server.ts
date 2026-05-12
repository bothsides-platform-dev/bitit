import 'server-only';
import { createHmac } from 'node:crypto';
import { auth } from '@/auth';

export type ChannelMember = {
  memberId: string;
  memberHash?: string;
  profile: { name: string | null; email: string };
};

let warnedMissingSecret = false;

export async function getChannelMember(): Promise<ChannelMember | null> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) return null;

    const secret = process.env.CHANNEL_IO_SECRET;
    let memberHash: string | undefined;
    if (secret) {
      memberHash = createHmac('sha256', secret).update(session.user.id).digest('hex');
    } else if (process.env.NODE_ENV !== 'production' && !warnedMissingSecret) {
      warnedMissingSecret = true;
      console.warn('[channel-io] CHANNEL_IO_SECRET not set — booting without memberHash.');
    }

    return {
      memberId: session.user.id,
      memberHash,
      profile: {
        name: session.user.name ?? null,
        email: session.user.email,
      },
    };
  } catch {
    return null;
  }
}

'use server';

import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

import { requireSession } from '@/lib/auth/session';
import { notifications as notifTable } from '@/lib/db/schema';
import { getNotificationRepo } from '@/lib/server/repositories/factory';
import {
  actionDb,
  type NotificationActionResult,
} from './_shared';

const Input = z.object({ notificationId: z.string().uuid() }).strict();

export type MarkNotificationReadInput = z.infer<typeof Input>;
export type MarkNotificationReadResult = NotificationActionResult;

/**
 * 알림 단건 읽음 처리. session.user.id 본인 row만 통과.
 * 타인 row 호출 시 NOT_FOUND(403 누설 회피).
 */
export async function markNotificationReadAction(
  input: MarkNotificationReadInput,
): Promise<MarkNotificationReadResult> {
  let session;
  try {
    session = await requireSession();
  } catch {
    return { ok: false, error: 'UNAUTHENTICATED' };
  }
  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const userId = session.user.id;
  const db = actionDb();

  // ownership 검증 — 다른 사용자 알림은 NOT_FOUND로 응답.
  const [row] = await db
    .select({ userId: notifTable.userId })
    .from(notifTable)
    .where(
      and(
        eq(notifTable.id, parsed.data.notificationId),
        eq(notifTable.userId, userId),
      ),
    )
    .limit(1);
  if (!row) return { ok: false, error: 'NOT_FOUND' };

  const repo = await getNotificationRepo();
  await repo.markRead(parsed.data.notificationId);
  return { ok: true };
}

'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { requireSession } from '@/lib/auth/session';
import { workspaces } from '@/lib/db/schema';
import { actionDb } from '../auth/_shared';

const Input = z.object({ name: z.string().min(1).max(200) }).strict();

export type RenameWorkspaceResult =
  | { ok: true }
  | { ok: false; error: 'INVALID_INPUT' | 'FORBIDDEN' | 'NOT_FOUND' };

export async function renameWorkspaceAction(input: {
  name: string;
}): Promise<RenameWorkspaceResult> {
  const session = await requireSession().catch(() => null);
  if (!session?.user?.workspaceId) return { ok: false, error: 'FORBIDDEN' };
  if (session.user.role !== 'admin') return { ok: false, error: 'FORBIDDEN' };

  const parsed = Input.safeParse({ name: input?.name?.trim() });
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const db = actionDb();
  const r = await db
    .update(workspaces)
    .set({ name: parsed.data.name })
    .where(eq(workspaces.id, session.user.workspaceId));

  if (r && typeof r === 'object' && 'rowCount' in r && r.rowCount === 0) {
    return { ok: false, error: 'NOT_FOUND' };
  }
  return { ok: true };
}

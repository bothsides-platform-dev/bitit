import { and, eq } from 'drizzle-orm';
import {
  workspaces,
  workspaceMembers,
  users as usersTable,
  bizProfiles,
} from '@/lib/db/schema';
import type { DB } from '@/lib/db/client';
import type { Workspace } from '@/lib/types/workspace';
import type { User } from '@/lib/types/user';
import type { WorkspaceRepo, Tx } from '../types';

type WsRow = typeof workspaces.$inferSelect;
type MemberRow = typeof workspaceMembers.$inferSelect;
type UserRow = typeof usersTable.$inferSelect;
type BizRow = typeof bizProfiles.$inferSelect;

const VALID_AVATAR_COLORS = [
  'lavender',
  'amber',
  'moss',
  'accent',
  'terra',
  'ink',
] as const;
type AvatarColor = (typeof VALID_AVATAR_COLORS)[number];

function normalizeAvatarColor(raw: string | null | undefined): AvatarColor {
  return (VALID_AVATAR_COLORS as readonly string[]).includes(raw ?? '')
    ? (raw as AvatarColor)
    : 'ink';
}

function rowToUser(u: UserRow, m: MemberRow): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarColor: normalizeAvatarColor(u.avatarColor),
    role: m.role,
    status: u.status === 'paused' ? 'paused' : 'active',
    joinedAt: new Date(m.joinedAt).toISOString(),
    lastSeenAt: m.lastSeenAt ? new Date(m.lastSeenAt).toISOString() : undefined,
  };
}

export class DrizzleWorkspaceRepository implements WorkspaceRepo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly _db: DB | any) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private h(tx?: Tx): any {
    return tx ?? this._db;
  }

  // Hydrate one workspace's members + biz profile with two cheap queries.
  // Inlined twice across finders would invite drift — kept private here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async hydrate(db: any, ws: WsRow): Promise<Workspace> {
    const memberRows = (await db
      .select({ m: workspaceMembers, u: usersTable })
      .from(workspaceMembers)
      .innerJoin(usersTable, eq(workspaceMembers.userId, usersTable.id))
      .where(eq(workspaceMembers.workspaceId, ws.id))) as { m: MemberRow; u: UserRow }[];

    const members: User[] = memberRows.map((r) => rowToUser(r.u, r.m));

    let bizProfile: Workspace['bizProfile'];
    if (ws.bizProfileId) {
      const [biz] = (await db
        .select()
        .from(bizProfiles)
        .where(eq(bizProfiles.id, ws.bizProfileId))
        .limit(1)) as BizRow[];
      if (biz) {
        bizProfile = {
          bizNo: biz.bizNo ?? undefined,
          taxType: biz.taxType ?? undefined,
          status: biz.status ?? undefined,
          grade: biz.grade ?? undefined,
          gradeSource: biz.gradeSource,
          gradeConfirmedBy: biz.gradeConfirmedBy ?? undefined,
          gradeConfirmedAt: biz.gradeConfirmedAt
            ? new Date(biz.gradeConfirmedAt).toISOString()
            : undefined,
        };
      }
    }

    return {
      id: ws.id,
      type: ws.type,
      name: ws.name,
      domain: ws.domain ?? undefined,
      bizProfile,
      members,
      createdAt: new Date(ws.createdAt).toISOString(),
    };
  }

  async save(ws: Workspace, tx?: Tx): Promise<void> {
    const db = this.h(tx);
    await db
      .insert(workspaces)
      .values({
        id: ws.id,
        type: ws.type,
        name: ws.name,
        domain: ws.domain ?? null,
        bizProfileId: null, // workspace.bizProfile is read-only hydration; updates go through BizProfileRepo + workspaces.bizProfileId
      })
      .onConflictDoUpdate({
        target: workspaces.id,
        set: { name: ws.name, domain: ws.domain ?? null },
      });

    // Sync members table — additive (we don't remove members here).
    for (const u of ws.members) {
      await db
        .insert(workspaceMembers)
        .values({
          workspaceId: ws.id,
          userId: u.id,
          role: u.role,
          joinedAt: new Date(u.joinedAt),
          lastSeenAt: u.lastSeenAt ? new Date(u.lastSeenAt) : null,
        })
        .onConflictDoNothing({
          target: [workspaceMembers.workspaceId, workspaceMembers.userId],
        });
    }
  }

  async findById(id: string, tx?: Tx): Promise<Workspace | undefined> {
    const db = this.h(tx);
    const [row] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);
    return row ? this.hydrate(db, row) : undefined;
  }

  async findByDomain(domain: string, tx?: Tx): Promise<Workspace | undefined> {
    const db = this.h(tx);
    const [row] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.domain, domain))
      .limit(1);
    return row ? this.hydrate(db, row) : undefined;
  }

  async autoJoinPg(
    userEmail: string,
    user: User,
    tx?: Tx,
  ): Promise<Workspace | null> {
    const db = this.h(tx);
    const domain = userEmail.split('@')[1];
    if (!domain) return null;

    const [ws] = await db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.domain, domain), eq(workspaces.type, 'pg')))
      .limit(1);
    if (!ws) return null;

    // Idempotent insert — if already a member, do nothing.
    await db
      .insert(workspaceMembers)
      .values({
        workspaceId: ws.id,
        userId: user.id,
        role: user.role,
        joinedAt: new Date(user.joinedAt),
        lastSeenAt: user.lastSeenAt ? new Date(user.lastSeenAt) : null,
      })
      .onConflictDoNothing({
        target: [workspaceMembers.workspaceId, workspaceMembers.userId],
      });

    return this.hydrate(db, ws);
  }
}

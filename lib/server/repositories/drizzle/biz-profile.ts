import { eq } from 'drizzle-orm';
import { bizProfiles } from '@/lib/db/schema';
import type { DB } from '@/lib/db/client';
import type { BizProfile } from '@/lib/types/biz-profile';
import type { BizProfileRepo, Tx } from '../types';

type BizRow = typeof bizProfiles.$inferSelect;

function rowToProfile(row: BizRow): BizProfile & { id: string } {
  return {
    id: row.id,
    bizNo: row.bizNo,
    taxType: row.taxType,
    status: row.status,
    grade: row.grade ?? undefined,
    gradeSource: row.gradeSource,
    gradeConfirmedBy: row.gradeConfirmedBy ?? undefined,
    gradeConfirmedAt: row.gradeConfirmedAt
      ? new Date(row.gradeConfirmedAt).toISOString()
      : undefined,
  };
}

export class DrizzleBizProfileRepository implements BizProfileRepo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly _db: DB | any) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private h(tx?: Tx): any {
    return tx ?? this._db;
  }

  async save(profile: BizProfile & { id: string }, tx?: Tx): Promise<void> {
    const db = this.h(tx);
    await db.insert(bizProfiles).values({
      id: profile.id,
      bizNo: profile.bizNo,
      taxType: profile.taxType,
      status: profile.status,
      grade: profile.grade ?? null,
      gradeSource: profile.gradeSource,
      gradeConfirmedBy: profile.gradeConfirmedBy ?? null,
      gradeConfirmedAt: profile.gradeConfirmedAt
        ? new Date(profile.gradeConfirmedAt)
        : null,
    });
  }

  async findById(
    id: string,
    tx?: Tx,
  ): Promise<(BizProfile & { id: string }) | undefined> {
    const db = this.h(tx);
    const [row] = await db
      .select()
      .from(bizProfiles)
      .where(eq(bizProfiles.id, id))
      .limit(1);
    return row ? rowToProfile(row) : undefined;
  }
}

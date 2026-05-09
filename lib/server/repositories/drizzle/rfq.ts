import { and, eq, sql } from 'drizzle-orm';
import { rfqs, bizProfiles } from '@/lib/db/schema';
import type { DB } from '@/lib/db/client';
import type { RFQ, RfqStatus } from '@/lib/types/rfq';
import type { BizProfile } from '@/lib/types/biz-profile';
import { assertTransition } from '../../rfq-state';
import type { RfqRepo, Tx } from '../types';

type RfqRow = typeof rfqs.$inferSelect;
type BizRow = typeof bizProfiles.$inferSelect;

function toIso(d: Date | null | undefined): string | undefined {
  return d ? new Date(d).toISOString() : undefined;
}

function rowToRfq(row: RfqRow, biz: BizRow | null): RFQ {
  const profile: BizProfile | undefined = biz
    ? {
        bizNo: biz.bizNo ?? undefined,
        taxType: biz.taxType ?? undefined,
        status: biz.status ?? undefined,
        grade: biz.grade ?? undefined,
        gradeSource: biz.gradeSource,
        gradeConfirmedBy: biz.gradeConfirmedBy ?? undefined,
        gradeConfirmedAt: toIso(biz.gradeConfirmedAt),
      }
    : undefined;
  return {
    id: row.id,
    buyerWsId: row.buyerWsId,
    bizProfile: profile,
    title: row.title,
    memo: row.memo,
    rfpFiles: [], // attachments hydrated separately when needed
    allowedPgWorkspaceIds: row.allowedPgWorkspaceIds ?? [],
    deadline: new Date(row.deadline).toISOString(),
    status: row.status,
    awardedBidId: row.awardedBidId ?? undefined,
    createdBy: row.createdBy,
    createdAt: new Date(row.createdAt).toISOString(),
    sentAt: toIso(row.sentAt),
    shareToken: row.shareToken,
  };
}

export class DrizzleRfqRepository implements RfqRepo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly _db: DB | any) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private h(tx?: Tx): any {
    return tx ?? this._db;
  }

  async save(rfq: RFQ, tx?: Tx): Promise<void> {
    const db = this.h(tx);
    // bizProfile 은 옵셔널. 들어있으면 bizNo 로 가장 최근 row 매칭, 없으면 null.
    let bizProfileId: string | null = null;
    if (rfq.bizProfile?.bizNo) {
      const [biz] = await db
        .select()
        .from(bizProfiles)
        .where(eq(bizProfiles.bizNo, rfq.bizProfile.bizNo))
        .orderBy(sql`${bizProfiles.createdAt} desc`)
        .limit(1);
      if (!biz) {
        throw new Error(
          `BizProfile not found for bizNo=${rfq.bizProfile.bizNo} — call BizProfileRepo.save first`,
        );
      }
      bizProfileId = biz.id;
    }

    // shareToken 미지정 시 DB default(gen_random_uuid()::text)로 폴백 — 호출자가
    // generateToken()으로 명시 지정해도 되고, 자동 생성도 안전.
    type Insertable = typeof rfqs.$inferInsert;
    const values: Insertable = {
      id: rfq.id,
      buyerWsId: rfq.buyerWsId,
      bizProfileId,
      title: rfq.title,
      memo: rfq.memo,
      allowedPgWorkspaceIds: rfq.allowedPgWorkspaceIds,
      deadline: new Date(rfq.deadline),
      status: rfq.status,
      awardedBidId: rfq.awardedBidId ?? null,
      createdBy: rfq.createdBy,
      sentAt: rfq.sentAt ? new Date(rfq.sentAt) : null,
    };
    if (rfq.shareToken) values.shareToken = rfq.shareToken;

    await db
      .insert(rfqs)
      .values(values)
      .onConflictDoUpdate({
        target: rfqs.id,
        set: {
          title: rfq.title,
          memo: rfq.memo,
          allowedPgWorkspaceIds: rfq.allowedPgWorkspaceIds,
          deadline: new Date(rfq.deadline),
          status: rfq.status,
          awardedBidId: rfq.awardedBidId ?? null,
          sentAt: rfq.sentAt ? new Date(rfq.sentAt) : null,
        },
      });
  }

  async findById(id: string, tx?: Tx): Promise<RFQ | undefined> {
    const db = this.h(tx);
    const [row] = await db
      .select({ rfq: rfqs, biz: bizProfiles })
      .from(rfqs)
      .leftJoin(bizProfiles, eq(rfqs.bizProfileId, bizProfiles.id))
      .where(eq(rfqs.id, id))
      .limit(1);
    return row ? rowToRfq(row.rfq, row.biz) : undefined;
  }

  async findByBuyerWs(wsId: string, tx?: Tx): Promise<RFQ[]> {
    const db = this.h(tx);
    const rows = await db
      .select({ rfq: rfqs, biz: bizProfiles })
      .from(rfqs)
      .leftJoin(bizProfiles, eq(rfqs.bizProfileId, bizProfiles.id))
      .where(eq(rfqs.buyerWsId, wsId));
    return rows.map((r: { rfq: RfqRow; biz: BizRow | null }) =>
      rowToRfq(r.rfq, r.biz),
    );
  }

  async findByShareToken(token: string, tx?: Tx): Promise<RFQ | undefined> {
    const db = this.h(tx);
    const [row] = await db
      .select({ rfq: rfqs, biz: bizProfiles })
      .from(rfqs)
      .leftJoin(bizProfiles, eq(rfqs.bizProfileId, bizProfiles.id))
      .where(eq(rfqs.shareToken, token))
      .limit(1);
    return row ? rowToRfq(row.rfq, row.biz) : undefined;
  }

  async transition(
    id: string,
    to: RfqStatus,
    patch?: Partial<RFQ>,
    tx?: Tx,
  ): Promise<RFQ> {
    const db = this.h(tx);

    // Read current state to assert transition (action-layer parity).
    const [current] = await db
      .select({ status: rfqs.status })
      .from(rfqs)
      .where(eq(rfqs.id, id))
      .limit(1);
    if (!current) throw new Error(`RFQ not found: ${id}`);
    assertTransition(current.status, to);

    // Atomic update with `WHERE status=$prev` concurrency guard.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setPatch: any = { status: to };
    if (patch?.awardedBidId !== undefined) setPatch.awardedBidId = patch.awardedBidId;
    if (patch?.sentAt !== undefined)
      setPatch.sentAt = patch.sentAt ? new Date(patch.sentAt) : null;
    if (patch?.title !== undefined) setPatch.title = patch.title;
    if (patch?.memo !== undefined) setPatch.memo = patch.memo;
    if (patch?.allowedPgWorkspaceIds !== undefined)
      setPatch.allowedPgWorkspaceIds = patch.allowedPgWorkspaceIds;
    if (patch?.deadline !== undefined) setPatch.deadline = new Date(patch.deadline);

    const updated = await db
      .update(rfqs)
      .set(setPatch)
      .where(and(eq(rfqs.id, id), eq(rfqs.status, current.status)))
      .returning();

    if (updated.length === 0) {
      throw new Error(`RFQ transition lost a race for ${id}`);
    }

    const after = await this.findById(id, tx);
    if (!after) throw new Error(`RFQ disappeared after transition: ${id}`);
    return after;
  }
}

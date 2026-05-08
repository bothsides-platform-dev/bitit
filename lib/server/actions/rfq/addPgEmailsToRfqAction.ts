'use server';

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';

import { requireBuyerSession } from '@/lib/auth/session';
import { rfqInvitations, rfqs } from '@/lib/db/schema';
import { actionDb, type RfqActionResult } from './_shared';

const Input = z
  .object({
    rfqId: z.string().regex(/^Q-\d{4}-\d{4}$/),
    emails: z.array(z.string().email()).min(1).max(20),
  })
  .strict();

export type AddPgEmailsInput = z.input<typeof Input>;
export type AddPgEmailsResult = RfqActionResult<{
  addedCount: number;
  skipped: string[];
}>;

const ALLOWED_PG_EMAILS_MAX = 50;

/**
 * 이미 발송된 RFQ에 PG 이메일을 추가 — `'draft'` 상태로 invitation row만
 * 누적해두고, 실제 메일 발송은 `sendDraftInvitationsAction`이 일괄 처리한다.
 *
 * 정책:
 *   - `status='sent' && deadline > now` RFQ만 (PG_RFQ_SPEC.md §7).
 *   - case-insensitive dedupe → 이미 등록된 이메일은 `skipped`로 응답.
 *   - 총 `allowedPgEmails`가 50개를 넘기면 `EMAILS_LIMIT_EXCEEDED`.
 *   - `(rfq_id, lower(pg_email))` 부분 unique index가 race를 DB 레벨에서 차단.
 *
 * 토큰 모델: draft 상태에서는 진짜 raw 토큰을 발급하지 않는다(이메일 본문 URL을
 * 만들 일이 없으므로). `tokenHash` 컬럼은 NOT NULL이므로 row id 기반 placeholder
 * (`draft-{uuid}`)를 넣어둔다. send 단계에서 `generateToken()`으로 진짜 raw를
 * 발급하고 hash를 갱신한다.
 */
export async function addPgEmailsToRfqAction(
  input: AddPgEmailsInput,
): Promise<AddPgEmailsResult> {
  let session;
  try {
    session = await requireBuyerSession();
  } catch {
    return { ok: false, error: 'FORBIDDEN_BUYER' };
  }

  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const wsId = session.user.workspaceId;
  const db = actionDb();

  const result = await db.transaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (tx: any): Promise<AddPgEmailsResult> => {
      const [row] = await tx
        .select({
          buyerWsId: rfqs.buyerWsId,
          status: rfqs.status,
          deadline: rfqs.deadline,
          allowedPgEmails: rfqs.allowedPgEmails,
        })
        .from(rfqs)
        .where(eq(rfqs.id, parsed.data.rfqId))
        .limit(1);
      if (!row) return { ok: false, error: 'NOT_FOUND' };
      if (row.buyerWsId !== wsId) return { ok: false, error: 'NOT_OWNED' };
      if (row.status !== 'sent') return { ok: false, error: 'RFQ_NOT_OPEN' };
      if (new Date(row.deadline).getTime() <= Date.now()) {
        return { ok: false, error: 'RFQ_DEADLINE_PASSED' };
      }

      // case-insensitive dedupe vs. 기존 allowlist
      const existing = new Set(
        (row.allowedPgEmails ?? []).map((e: string) => e.trim().toLowerCase()),
      );
      const seenInBatch = new Set<string>();
      const toAdd: string[] = [];
      const skipped: string[] = [];
      for (const raw of parsed.data.emails) {
        const norm = raw.trim().toLowerCase();
        if (existing.has(norm) || seenInBatch.has(norm)) {
          skipped.push(raw);
          continue;
        }
        seenInBatch.add(norm);
        toAdd.push(raw.trim());
      }

      if (toAdd.length === 0) {
        return { ok: true, addedCount: 0, skipped };
      }

      const totalAfter = (row.allowedPgEmails ?? []).length + toAdd.length;
      if (totalAfter > ALLOWED_PG_EMAILS_MAX) {
        return { ok: false, error: 'EMAILS_LIMIT_EXCEEDED' };
      }

      // allowlist union update
      const merged = [...(row.allowedPgEmails ?? []), ...toAdd];
      await tx
        .update(rfqs)
        .set({ allowedPgEmails: merged })
        .where(eq(rfqs.id, parsed.data.rfqId));

      // draft invitation rows. tokenHash placeholder 'draft-{invId}'를 넣어 NOT
      // NULL/UNIQUE 제약을 충족 — sendDraftInvitationsAction이 진짜 hash로 갱신.
      const expiresAt = new Date(row.deadline);
      for (const email of toAdd) {
        const invId = randomUUID();
        await tx.insert(rfqInvitations).values({
          id: invId,
          rfqId: parsed.data.rfqId,
          pgEmail: email,
          tokenHash: `draft-${invId}`,
          sentAt: new Date(),
          expiresAt,
          status: 'draft',
        });
      }

      return { ok: true, addedCount: toAdd.length, skipped };
    },
  );

  return result;
}

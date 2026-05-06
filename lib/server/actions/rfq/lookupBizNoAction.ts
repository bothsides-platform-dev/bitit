'use server';

import { z } from 'zod';
import { requireSession } from '@/lib/auth/session';
import { getNtsClient, NtsError, type NtsLookupResult } from '@/lib/integrations/nts';
import type { RfqActionResult } from './_shared';

const Input = z.string().min(8).max(20);

export type LookupBizNoResult = RfqActionResult<NtsLookupResult>;

/**
 * NTS 사업자번호 조회. 모든 회원 호출 가능. 실연동 mock 폴백 없음 — 테스트는
 * `__setNtsClientForTest(new MockNtsClient())` 로 주입한다.
 *
 * 반환:
 *   - ok: true  + valid:true + taxType + status        (정상 조회)
 *   - ok: true  + valid:false                          (등록 안 됨)
 *   - ok: false + error: 'NTS_*'                       (키 누락/만료/네트워크)
 */
export async function lookupBizNoAction(
  bizNo: string,
): Promise<LookupBizNoResult> {
  // 인증된 사용자만. PG 회원도 사업자번호 조회는 가능 (정책 — buyer-only로
  // 좁히지 않음. PG는 자기 사업자번호 검증용으로 쓸 여지 있음).
  try {
    await requireSession();
  } catch {
    return { ok: false, error: 'UNAUTHENTICATED' };
  }

  const parsed = Input.safeParse(bizNo);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  try {
    const result = await getNtsClient().lookup(parsed.data);
    return { ok: true, ...result };
  } catch (e) {
    if (e instanceof NtsError) {
      return { ok: false, error: e.code };
    }
    return { ok: false, error: 'NTS_NETWORK' };
  }
}

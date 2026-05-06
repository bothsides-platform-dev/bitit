// Test-only NtsClient. lib/mock/biz-lookup.ts BIZ_DB의 3개 사업자번호 매핑을
// 그대로 재사용해서 테스트가 손쉽게 happy-path/not-found 두 갈래를 검증할 수
// 있게 한다. lib/mock/biz-lookup.ts는 Step 13 (cutover)에 일괄 삭제 예정이라
// 그 시점에는 이 파일도 자기 안에 데이터를 가져야 한다 — 지금은 의존성 한
// 줄 (`import` 없음, 자가 BIZ_DB 사본)로 분리해 둔다.
import type { NtsClient, NtsLookupResult } from './nts';

type MockEntry = {
  taxType: NonNullable<NtsLookupResult['taxType']>;
  status: NonNullable<NtsLookupResult['status']>;
};

// lib/mock/biz-lookup.ts BIZ_DB와 동일한 3건. 키는 공백/하이픈 무관하게 매칭
// 되도록 lookup() 안에서 정규화한다.
export const MOCK_NTS_DB: Record<string, MockEntry> = {
  '1234567890': { taxType: 'general', status: 'active' },
  '2345678901': { taxType: 'general', status: 'active' },
  '3456789012': { taxType: 'simple', status: 'active' },
  // 폐업/휴업 케이스를 강제로 매핑 — 테스트에서 status 분기 검증.
  '9999999999': { taxType: 'general', status: 'closed' },
  '8888888888': { taxType: 'general', status: 'suspended' },
};

export class MockNtsClient implements NtsClient {
  async lookup(bizNo: string): Promise<NtsLookupResult> {
    const digits = bizNo.replace(/\D/g, '');
    const hit = MOCK_NTS_DB[digits];
    if (!hit) return { valid: false };
    return { valid: true, taxType: hit.taxType, status: hit.status };
  }
}

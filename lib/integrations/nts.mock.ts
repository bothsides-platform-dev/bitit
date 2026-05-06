// Test-only NtsClient. 실제 NTS API 호출 없이 happy-path/not-found/폐업/휴업
// 분기를 손쉽게 검증할 수 있도록 자가 사본 5건을 가지고 있다. lib/mock/* 와는
// 별개의 통합 테스트 헬퍼라서 Step 13 cutover에서도 함께 정리되지 않는다.
import type { NtsClient, NtsLookupResult } from './nts';

type MockEntry = {
  taxType: NonNullable<NtsLookupResult['taxType']>;
  status: NonNullable<NtsLookupResult['status']>;
};

// 키는 공백/하이픈 무관하게 매칭되도록 lookup() 안에서 정규화한다.
const NTS_TEST_DB: Record<string, MockEntry> = {
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
    const hit = NTS_TEST_DB[digits];
    if (!hit) return { valid: false };
    return { valid: true, taxType: hit.taxType, status: hit.status };
  }
}

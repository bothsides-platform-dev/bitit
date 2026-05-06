import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __setNtsClientForTest,
  NtsError,
  type NtsClient,
} from '@/lib/integrations/nts';
import { MockNtsClient } from '@/lib/integrations/nts.mock';
import { setupRfqActionEnv, teardownRfqActionEnv } from './_setup';

const sessionRef: { value: { user: { id: string } } | null } = { value: null };

vi.mock('@/lib/auth/session', () => ({
  requireSession: () => {
    if (!sessionRef.value) return Promise.reject(new Error('UNAUTHENTICATED'));
    return Promise.resolve(sessionRef.value);
  },
  requireBuyerSession: () => Promise.reject(new Error('not used')),
}));

import { lookupBizNoAction } from '../lookupBizNoAction';

describe('lookupBizNoAction', () => {
  beforeEach(async () => {
    await setupRfqActionEnv();
    sessionRef.value = { user: { id: 'u-1' } };
  });
  afterEach(() => {
    teardownRfqActionEnv();
    sessionRef.value = null;
  });

  it('returns NTS lookup result for a known bizNo', async () => {
    const r = await lookupBizNoAction('1234567890');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valid).toBe(true);
    expect(r.taxType).toBe('general');
    expect(r.status).toBe('active');
  });

  it('returns valid:false for an unknown bizNo (mock)', async () => {
    const r = await lookupBizNoAction('0000000000');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valid).toBe(false);
  });

  it('rejects when no session', async () => {
    sessionRef.value = null;
    const r = await lookupBizNoAction('1234567890');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('UNAUTHENTICATED');
  });

  it('rejects malformed bizNo input', async () => {
    const r = await lookupBizNoAction('123');
    expect(r.ok).toBe(false);
  });

  it('returns NTS_NO_KEY when client is configured without key', async () => {
    const throwing: NtsClient = {
      lookup: () => Promise.reject(new NtsError('NTS_NO_KEY')),
    };
    __setNtsClientForTest(throwing);
    const r = await lookupBizNoAction('1234567890');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('NTS_NO_KEY');
  });

  it('returns NTS_INVALID_KEY when upstream rejects auth', async () => {
    const throwing: NtsClient = {
      lookup: () => Promise.reject(new NtsError('NTS_INVALID_KEY')),
    };
    __setNtsClientForTest(throwing);
    const r = await lookupBizNoAction('1234567890');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('NTS_INVALID_KEY');
  });

  it('returns NTS_NETWORK on transport failure', async () => {
    const throwing: NtsClient = {
      lookup: () => Promise.reject(new NtsError('NTS_NETWORK', 'timeout')),
    };
    __setNtsClientForTest(throwing);
    const r = await lookupBizNoAction('1234567890');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('NTS_NETWORK');
  });

  it('reuses MockNtsClient default after test override', async () => {
    __setNtsClientForTest(new MockNtsClient());
    const r = await lookupBizNoAction('3456789012');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.taxType).toBe('simple');
  });
});

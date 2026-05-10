'use client';

import { useEffect, useRef } from 'react';
import { toast } from '@/lib/toast';

export function PgRfqBlockedToast() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    toast('RFQ 작성은 구매사 계정 전용입니다. 응답은 인박스에서 확인하세요.', { type: 'info' });
  }, []);

  return null;
}

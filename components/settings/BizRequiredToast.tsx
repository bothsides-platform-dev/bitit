'use client';

import { useEffect } from 'react';
import { toast } from '@/lib/toast';

export function BizRequiredToast() {
  useEffect(() => {
    toast('견적 생성 전 사업자번호를 등록해 주세요.', { type: 'info' });
  }, []);
  return null;
}

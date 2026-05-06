import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/lib/server/actions/auth', () => ({
  loginAction: vi.fn().mockResolvedValue({ ok: false, error: 'INVALID_CREDENTIALS' }),
}));

import LoginPage from '@/app/(public)/login/page';

describe('LoginPage — 이메일 프리필', () => {
  beforeEach(() => {
    mockSearchParams.delete('email');
    mockSearchParams.delete('next');
  });

  it('?email 파라미터가 없으면 이메일 필드가 비어있다', () => {
    render(<LoginPage />);
    const input = screen.getByLabelText('이메일') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('?email 파라미터가 있으면 이메일 필드에 값이 채워진다', () => {
    mockSearchParams.set('email', 'kim@example.com');
    render(<LoginPage />);
    const input = screen.getByLabelText('이메일') as HTMLInputElement;
    expect(input.value).toBe('kim@example.com');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignupEmailAction = vi.fn();
vi.mock('@/lib/server/actions/auth', () => ({
  signupEmailAction: (...args: unknown[]) => mockSignupEmailAction(...args),
}));

vi.mock('@/lib/stores/signup-draft', () => ({
  useSignupDraftStore: () => ({
    setEmail: vi.fn(),
    setAgreedAt: vi.fn(),
    setWorkspaceType: vi.fn(),
  }),
}));

vi.mock('@/lib/auth/signup-storage', () => ({
  readSignupDraft: () => ({}),
  writeSignupDraft: vi.fn(),
}));

import BuyerSignupEmailPage from '@/app/(public)/signup/buyer/page';
import PgSignupEmailPage from '@/app/(public)/signup/pg/page';

async function fillAndSubmit(email = 'kim@example.com') {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('이메일'), email);
  // click checkboxes by accessible role+name
  await user.click(screen.getByRole('checkbox', { name: /이용약관 동의/i }));
  await user.click(screen.getByRole('checkbox', { name: /개인정보 처리방침 동의/i }));
  // submit the form directly (form element has no accessible name so getByRole('form') fails)
  // eslint-disable-next-line testing-library/no-node-access
  const form = document.querySelector('form')!;
  fireEvent.submit(form);
  await new Promise((r) => setTimeout(r, 0)); // flush microtasks
}

describe('BuyerSignupEmailPage — EMAIL_TAKEN 안내', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSignupEmailAction.mockReset();
    render(<BuyerSignupEmailPage />);
  });

  it('EMAIL_TAKEN 시 이미 가입된 이메일 메시지를 표시한다', async () => {
    mockSignupEmailAction.mockResolvedValueOnce({ ok: false, error: 'EMAIL_TAKEN' });
    await fillAndSubmit('kim@example.com');
    await waitFor(() => {
      expect(screen.getByText('이미 가입된 이메일입니다.')).toBeInTheDocument();
    });
  });

  it('EMAIL_TAKEN 시 로그인 링크에 이메일이 포함된다', async () => {
    mockSignupEmailAction.mockResolvedValueOnce({ ok: false, error: 'EMAIL_TAKEN' });
    await fillAndSubmit('kim@example.com');
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /로그인하기/i });
      expect(link.getAttribute('href')).toContain('/login?email=');
      expect(link.getAttribute('href')).toContain('kim%40example.com');
    });
  });

  it('EMAIL_TAKEN 시 페이지 이동하지 않는다', async () => {
    mockSignupEmailAction.mockResolvedValueOnce({ ok: false, error: 'EMAIL_TAKEN' });
    await fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByText('이미 가입된 이메일입니다.')).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('다른 에러 시 일반 에러 메시지를 표시한다', async () => {
    mockSignupEmailAction.mockResolvedValueOnce({ ok: false, error: 'INVALID_INPUT' });
    await fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.queryByText('이미 가입된 이메일입니다.')).not.toBeInTheDocument();
    });
  });

  it('성공 시 verify 페이지로 이동한다', async () => {
    mockSignupEmailAction.mockResolvedValueOnce({ ok: true, email: 'kim@example.com' });
    await fillAndSubmit();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/signup/buyer/verify');
    });
  });
});

describe('PgSignupEmailPage — EMAIL_TAKEN 안내', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSignupEmailAction.mockReset();
    render(<PgSignupEmailPage />);
  });

  it('EMAIL_TAKEN 시 이미 가입된 이메일 메시지를 표시한다', async () => {
    mockSignupEmailAction.mockResolvedValueOnce({ ok: false, error: 'EMAIL_TAKEN' });
    await fillAndSubmit('sales@toss.im');
    await waitFor(() => {
      expect(screen.getByText('이미 가입된 이메일입니다.')).toBeInTheDocument();
    });
  });

  it('EMAIL_TAKEN 시 로그인 링크에 이메일이 포함된다', async () => {
    mockSignupEmailAction.mockResolvedValueOnce({ ok: false, error: 'EMAIL_TAKEN' });
    await fillAndSubmit('sales@toss.im');
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /로그인하기/i });
      expect(link.getAttribute('href')).toContain('sales%40toss.im');
    });
  });

  it('성공 시 pg verify 페이지로 이동한다', async () => {
    mockSignupEmailAction.mockResolvedValueOnce({ ok: true, email: 'sales@toss.im' });
    await fillAndSubmit('sales@toss.im');
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/signup/pg/verify');
    });
  });
});

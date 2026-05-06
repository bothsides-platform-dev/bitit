import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GradeConfirmPanel } from '../GradeConfirmPanel';

describe('GradeConfirmPanel', () => {
  it('renders all five merchant-grade radios', () => {
    render(<GradeConfirmPanel onConfirm={() => {}} />);
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByLabelText(/영세/)).toBeInTheDocument();
    expect(screen.getByLabelText(/중소1/)).toBeInTheDocument();
    expect(screen.getByLabelText(/중소2/)).toBeInTheDocument();
    expect(screen.getByLabelText(/중소3/)).toBeInTheDocument();
    expect(screen.getByLabelText(/일반/)).toBeInTheDocument();
  });

  it('shows statutory card fee for fixed grades and "협상" for general', () => {
    render(<GradeConfirmPanel onConfirm={() => {}} />);
    // Fixed-fee grades render percentage strings.
    expect(screen.getByText('카드 0.50%')).toBeInTheDocument();
    expect(screen.getByText('카드 1.10%')).toBeInTheDocument();
    expect(screen.getByText('카드 1.25%')).toBeInTheDocument();
    expect(screen.getByText('카드 1.50%')).toBeInTheDocument();
    // General row uses negotiation copy because STATUTORY_CARD_FEE.general is NaN.
    expect(screen.getByText('카드 협상')).toBeInTheDocument();
  });

  it('emits the selected grade with source=user_confirmed on 확인', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<GradeConfirmPanel onConfirm={onConfirm} />);

    await user.click(screen.getByLabelText(/중소3/));
    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('sme3', 'user_confirmed');
  });

  it('emits source=user_confirmed even for the general grade', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<GradeConfirmPanel onConfirm={onConfirm} />);

    await user.click(screen.getByLabelText(/일반/));
    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(onConfirm).toHaveBeenCalledWith('general', 'user_confirmed');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleChooser } from '../RoleChooser';

describe('RoleChooser', () => {
  it('renders two role cards', () => {
    render(<RoleChooser onSelect={() => {}} />);
    expect(screen.getByText('구매사')).toBeInTheDocument();
    expect(screen.getByText('PG사 영업담당')).toBeInTheDocument();
  });

  it('calls onSelect("buyer") when buyer card is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RoleChooser onSelect={onSelect} />);
    await user.click(screen.getByText('구매사'));
    expect(onSelect).toHaveBeenCalledWith('buyer');
  });

  it('calls onSelect("pg") when PG card is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RoleChooser onSelect={onSelect} />);
    await user.click(screen.getByText('PG사 영업담당'));
    expect(onSelect).toHaveBeenCalledWith('pg');
  });
});

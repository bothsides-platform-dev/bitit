import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceTypeRadio } from '../WorkspaceTypeRadio';

describe('WorkspaceTypeRadio', () => {
  it('renders both options with bracket markings', () => {
    render(<WorkspaceTypeRadio value="buyer" onChange={() => {}} />);
    expect(screen.getByText('구매사')).toBeInTheDocument();
    expect(screen.getByText('결제대행사 (PG)')).toBeInTheDocument();
    // Selected option shows the [ 선택됨 ] bracket marking.
    expect(screen.getByText('선택됨')).toBeInTheDocument();
    // Unselected option shows its short bracket label (PG).
    expect(screen.getByText('PG', { selector: 'span' })).toBeInTheDocument();
  });

  it('marks the current value as checked', () => {
    const { container } = render(
      <WorkspaceTypeRadio value="pg" onChange={() => {}} />,
    );
    const buyerRadio = container.querySelector<HTMLInputElement>(
      '#ws-kind-buyer',
    );
    const pgRadio = container.querySelector<HTMLInputElement>('#ws-kind-pg');
    expect(buyerRadio).not.toBeNull();
    expect(pgRadio).not.toBeNull();
    expect(buyerRadio).not.toBeChecked();
    expect(pgRadio).toBeChecked();
  });

  it('calls onChange with the new value when the user clicks the other option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <WorkspaceTypeRadio value="buyer" onChange={onChange} />,
    );
    const pgRadio = container.querySelector<HTMLInputElement>('#ws-kind-pg');
    expect(pgRadio).not.toBeNull();
    await user.click(pgRadio!);
    expect(onChange).toHaveBeenCalledWith('pg');
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { ChecklistButton } from '@/components/trips/ChecklistButton';

describe('ChecklistButton', () => {
  it('renders button and badge when pending items are present', () => {
    const handleClick = jest.fn();
    render(<ChecklistButton onClick={handleClick} pendingCount={3} />);

    expect(screen.getByRole('button', { name: /checklist/i })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /checklist/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not render badge when pending count is zero or undefined', () => {
    const { rerender } = render(<ChecklistButton onClick={() => {}} pendingCount={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();

    rerender(<ChecklistButton onClick={() => {}} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});

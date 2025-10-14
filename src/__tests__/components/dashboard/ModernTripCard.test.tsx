
import { render, screen } from '@testing-library/react';
import ModernTripCard from '@/components/dashboard/ModernTripCard';

const mockTrip = {
  id: '1',
  name: 'Trip to Paris',
  description: 'A beautiful trip to the city of lights.',
  start_date: '2025-11-15T00:00:00.000Z',
  end_date: '2025-11-22T00:00:00.000Z',
  destination: 'Paris, France',
  created_at: '2025-10-14T00:00:00.000Z',
};

const mockStatus = {
  text: 'Upcoming',
  color: 'from-emerald-500 to-teal-500',
  emoji: '🚀',
};

describe('ModernTripCard', () => {
  it('renders the trip name', () => {
    render(<ModernTripCard trip={mockTrip} status={mockStatus} />);
    expect(screen.getByText('Trip to Paris')).toBeInTheDocument();
  });

  it('renders the trip destination', () => {
    render(<ModernTripCard trip={mockTrip} status={mockStatus} />);
    expect(screen.getByText('Paris, France')).toBeInTheDocument();
  });

  it('renders the trip dates', () => {
    render(<ModernTripCard trip={mockTrip} status={mockStatus} />);
    expect(screen.getByText('15 Nov 2025 - 22 Nov 2025')).toBeInTheDocument();
  });

  it('renders the favorite button', () => {
    render(<ModernTripCard trip={mockTrip} status={mockStatus} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies a faded effect to completed trips', () => {
    const completedStatus = { ...mockStatus, text: 'Completed' };
    const { container } = render(<ModernTripCard trip={mockTrip} status={completedStatus} />);
    expect(container.firstChild.firstChild).toHaveClass('opacity-75');
  });
});

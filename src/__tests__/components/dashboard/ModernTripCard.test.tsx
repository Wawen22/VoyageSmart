
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

describe('ModernTripCard', () => {
  it('renders the trip name', () => {
    render(<ModernTripCard trip={mockTrip} />);
    expect(screen.getByText('Trip to Paris')).toBeInTheDocument();
  });

  it('renders the trip destination', () => {
    render(<ModernTripCard trip={mockTrip} />);
    expect(screen.getByText('Paris, France')).toBeInTheDocument();
  });

  it('renders the trip dates', () => {
    render(<ModernTripCard trip={mockTrip} />);
    expect(screen.getByText('15 Nov 2025 - 22 Nov 2025')).toBeInTheDocument();
  });

  it('renders the favorite button', () => {
    render(<ModernTripCard trip={mockTrip} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

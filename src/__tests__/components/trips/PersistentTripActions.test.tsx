
import { render, screen } from '@testing-library/react';
import PersistentTripActions from '@/components/trips/PersistentTripActions';
import { useSubscription } from '@/lib/subscription';

// Mock the useSubscription hook
jest.mock('@/lib/subscription', () => ({
  useSubscription: jest.fn(),
}));

describe('PersistentTripActions', () => {
  beforeEach(() => {
    (useSubscription as jest.Mock).mockReturnValue({ subscription: { tier: 'premium' } });
  });

  it('renders the Travel Journal link', () => {
    render(<PersistentTripActions tripId="trip-123" />);
    // Use a custom function to find the link by its text content
    const journalLink = screen.getByText((content, element) => {
        // Check if the element is a link and its text content is 'Travel Journal'
        return element?.tagName.toLowerCase() === 'h4' && content === 'Travel Journal';
      });
    expect(journalLink).toBeInTheDocument();
  });

  it('has the correct href for the Travel Journal link', () => {
    render(<PersistentTripActions tripId="trip-123" />);
    const journalLink = screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === 'h4' && content === 'Travel Journal';
      }).closest('a');
    expect(journalLink).toHaveAttribute('href', '/trips/trip-123/journal');
  });
});

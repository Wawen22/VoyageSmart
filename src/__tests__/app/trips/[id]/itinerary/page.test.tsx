
import { render, screen, waitFor } from '@testing-library/react';
import TripItinerary from '@/app/trips/[id]/itinerary/page';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

// Mock the hooks
jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/lib/subscription', () => ({
  useSubscription: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Mock supabase
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
};
jest.mock('@/lib/supabase', () => ({ supabase: mockSupabase }));


describe('TripItinerary Page', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-123' } });
    (useSubscription as jest.Mock).mockReturnValue({ canAccessFeature: jest.fn(() => true) });
    (useParams as jest.Mock).mockReturnValue({ id: 'trip-123' });
    mockSupabase.single.mockResolvedValue({ data: { id: 'trip-123', name: 'My Trip' }, error: null });
    mockSupabase.maybeSingle.mockResolvedValue({ data: { id: 'participant-123' }, error: null });
  });

  it('does not render the Journal tab', async () => {
    render(<TripItinerary />);
    await waitFor(() => {
        const journalTab = screen.queryByText((content, element) => {
            return element?.tagName.toLowerCase() === 'span' && content === 'Journal';
          });
        expect(journalTab).not.toBeInTheDocument();
    });
  });
});

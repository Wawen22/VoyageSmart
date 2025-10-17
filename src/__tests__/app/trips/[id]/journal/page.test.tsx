
import { render, screen, waitFor } from '@testing-library/react';
import TripJournal from '@/app/trips/[id]/journal/page';
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

// Mock Redux
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(() => jest.fn()),
  useSelector: jest.fn((selector) => selector({
    journal: {
      entries: [],
      media: [],
      loading: false,
    },
  })),
}));

describe('TripJournal Page', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-123' } });
    (useSubscription as jest.Mock).mockReturnValue({ canAccessFeature: jest.fn(() => true) });
    (useParams as jest.Mock).mockReturnValue({ id: 'trip-123' });
    mockSupabase.single.mockResolvedValue({ data: { id: 'trip-123', name: 'My Trip' }, error: null });
    mockSupabase.maybeSingle.mockResolvedValue({ data: { id: 'participant-123' }, error: null });
  });

  it('renders the journal page title', async () => {
    render(<TripJournal />);
    await waitFor(() => {
        expect(screen.getByText('Travel Journal')).toBeInTheDocument();
    });
  });
});

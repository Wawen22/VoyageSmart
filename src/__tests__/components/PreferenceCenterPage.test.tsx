import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PreferenceCenterPage from '@/app/profile/preferences/page';

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn()
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    message: jest.fn()
  }
}));

jest.mock('@/lib/supabase-client', () => ({
  createClientSupabase: jest.fn()
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com'
};

describe('PreferenceCenterPage', () => {
  const mockFetch = global.fetch as jest.Mock;
  const mockUseAuth = require('@/lib/auth').useAuth as jest.Mock;
  const mockUseRouter = require('next/navigation').useRouter as jest.Mock;
  const mockCreateClientSupabase = require('@/lib/supabase-client').createClientSupabase as jest.Mock;
  const supabaseSession = {
    data: {
      session: {
        access_token: 'token-123'
      }
    }
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser
    });
    mockUseRouter.mockReturnValue({
      replace: jest.fn(),
      push: jest.fn()
    });
    global.fetch = jest.fn();
    mockCreateClientSupabase.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue(supabaseSession)
      }
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = mockFetch;
    mockCreateClientSupabase.mockReset();
  });

  it('loads existing preferences and saves updates', async () => {
    const initialPreferences = {
      travelStyle: 'culture',
      interests: ['history'],
      dietaryRestrictions: [],
      preferredClimate: 'temperate',
      accommodationStyle: 'hotel',
      transportationModes: ['walking', 'public-transit'],
      budgetLevel: 'moderate',
      mobilityLevel: 'average',
      aiPersonality: 'balanced',
      notes: 'Love local guides'
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: initialPreferences })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            ...initialPreferences,
            interests: ['history', 'nightlife']
          }
        })
      });

    render(<PreferenceCenterPage />);

    await waitFor(() => {
      expect(screen.getByText(/Tailor VoyageSmart to your travel style/i)).toBeInTheDocument();
    });

    // Ensure initial fetch executed
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/preferences',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123'
        })
      })
    );

    const nightlifeButton = screen.getByRole('button', { name: /nightlife/i });
    await userEvent.click(nightlifeButton);

    const saveButton = screen.getByRole('button', { name: /save preferences/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/preferences',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    const requestInit = (global.fetch as jest.Mock).mock.calls[1][1];
    const requestPayload = JSON.parse(requestInit.body);
    expect(requestPayload.interests).toContain('nightlife');
    expect(requestPayload.interests).toContain('history');
    expect(requestInit.headers.Authorization).toBe('Bearer token-123');
  });
});

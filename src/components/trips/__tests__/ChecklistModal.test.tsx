jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } }
      })
    }
  }
}));

import { render, screen, waitFor } from '@testing-library/react';
import { ChecklistModal } from '@/components/trips/ChecklistModal';
import { supabase } from '@/lib/supabase';

const mockGetSession = supabase.auth.getSession as jest.Mock;

describe('ChecklistModal', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    if (mockGetSession) {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } }
      });
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (mockGetSession) {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } }
      });
    }
    global.fetch = originalFetch;
  });

  it('fetches and displays checklist data when opened', async () => {
    const checklists = [
      {
        id: 'cl-1',
        tripId: 'trip-1',
        ownerId: 'user-1',
        name: 'Personal Checklist',
        type: 'personal' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        items: [
          {
            id: 'item-1',
            checklistId: 'cl-1',
            content: 'Pack passport',
            isChecked: false,
            itemOrder: 0,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ]
      },
      {
        id: 'cl-2',
        tripId: 'trip-1',
        ownerId: null,
        name: 'Group Checklist',
        type: 'group' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        items: []
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, checklists })
    });

    const handleOpenChange = jest.fn();
    const handlePendingChange = jest.fn();

    render(
      <ChecklistModal
        tripId="trip-1"
        open
        onOpenChange={handleOpenChange}
        onPendingCountChange={handlePendingChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Personal Checklist')).toBeInTheDocument();
    });

    expect(screen.getByText('Pack passport')).toBeInTheDocument();
    expect(handlePendingChange).toHaveBeenCalled();
    expect(handlePendingChange).toHaveBeenLastCalledWith(1);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/trips/trip-1/checklists');
    expect(options.credentials).toBe('include');
    const authHeader =
      options.headers instanceof Headers
        ? options.headers.get('Authorization')
        : options.headers?.Authorization ?? options.headers?.authorization;
    expect(authHeader).toBe('Bearer test-token');
  });

  it('shows an error message when fetching fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to load checklists' })
    });

    render(
      <ChecklistModal
        tripId="trip-2"
        open
        onOpenChange={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load checklists')).toBeInTheDocument();
    });
  });
});

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } }
      })
    }
  }
}));

import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { useState } from 'react';
import { ChecklistButton } from '@/components/trips/ChecklistButton';
import { ChecklistModal } from '@/components/trips/ChecklistModal';
import { supabase } from '@/lib/supabase';

const mockGetSession = supabase.auth.getSession as jest.Mock;

describe('Checklist feature integration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        checklists: [
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
                content: 'Confirm booking',
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
        ]
      })
    });
    if (mockGetSession) {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } }
      });
    }
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
    if (mockGetSession) {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } }
      });
    }
  });

  const Wrapper = () => {
    const [open, setOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    return (
      <div>
        <ChecklistButton onClick={() => setOpen(true)} pendingCount={pendingCount} />
        <ChecklistModal
          tripId="trip-1"
          open={open}
          onOpenChange={setOpen}
          onPendingCountChange={setPendingCount}
        />
      </div>
    );
  };

  it('opens the checklist modal and updates the button badge', async () => {
    render(<Wrapper />);

    const button = screen.getByRole('button', { name: /checklist/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Personal Checklist')).toBeInTheDocument();
    });

    expect(screen.getByText('Confirm booking')).toBeInTheDocument();
    const badge = within(button).getByText('1');
    expect(badge).toBeInTheDocument();
  });
});

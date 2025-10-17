jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: any, init?: ResponseInit) => ({
      body,
      status: init?.status ?? 200,
      headers: {},
      json: async () => body
    }))
  },
  NextRequest: class {}
}));

import type { NextRequest } from 'next/server';
import { resolveRequestClient } from '@/app/api/checklists/_utils';
import { createChecklist, listChecklists } from '@/lib/services/checklistService';

jest.mock('@/app/api/checklists/_utils', () => {
  const actual = jest.requireActual('@/app/api/checklists/_utils');
  return {
    ...actual,
    resolveRequestClient: jest.fn()
  };
});

jest.mock('@/lib/services/checklistService', () => ({
  ...jest.requireActual('@/lib/services/checklistService'),
  listChecklists: jest.fn(),
  createChecklist: jest.fn()
}));

const mockedResolveRequestClient = resolveRequestClient as jest.MockedFunction<
  typeof resolveRequestClient
>;
const mockedListChecklists = listChecklists as jest.MockedFunction<typeof listChecklists>;
const mockedCreateChecklist = createChecklist as jest.MockedFunction<typeof createChecklist>;

let GET: typeof import('@/app/api/trips/[tripId]/checklists/route').GET;
let POST: typeof import('@/app/api/trips/[tripId]/checklists/route').POST;

const buildRequest = () => ({} as NextRequest);
const buildJsonRequest = (body: unknown) =>
  ({
    json: async () => body
  } as unknown as NextRequest);

describe('Trip checklists API route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    const routeModule = await import('@/app/api/trips/[tripId]/checklists/route');
    GET = routeModule.GET;
    POST = routeModule.POST;
    if (!GET || !POST) {
      throw new Error('Route handlers failed to load');
    }
  });

  describe('GET', () => {
    it('returns checklists for authenticated users', async () => {
      const mockChecklists = [
        {
          id: 'cl-1',
          tripId: 'trip-1',
          ownerId: 'user-1',
          name: 'Personal Checklist',
          type: 'personal' as const,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          items: []
        }
      ];

      mockedResolveRequestClient.mockResolvedValue({
        client: {} as any,
        userId: 'user-1'
      });
      mockedListChecklists.mockResolvedValue(mockChecklists);

      const response = await GET(buildRequest(), {
        params: { tripId: 'trip-1' }
      });

      expect(mockedResolveRequestClient).toHaveBeenCalled();
      expect(response).toBeDefined();
      expect(response?.status).toBe(200);
      const payload = await response.json();
      expect(payload).toEqual({
        success: true,
        checklists: mockChecklists
      });
      expect(mockedListChecklists).toHaveBeenCalledWith({}, 'trip-1', 'user-1');
    });

    it('returns 401 when the user is not authenticated', async () => {
      mockedResolveRequestClient.mockResolvedValue({
        client: {} as any,
        userId: null
      });

      const response = await GET(buildRequest(), {
        params: { tripId: 'trip-unauthorized' }
      });

      expect(response).toBeDefined();
      expect(response?.status).toBe(401);
      const payload = await response.json();
      expect(payload).toEqual({ error: 'Unauthorized' });
      expect(mockedListChecklists).not.toHaveBeenCalled();
    });
  });

  describe('POST', () => {
    it('creates a checklist when user is authenticated', async () => {
      mockedResolveRequestClient.mockResolvedValue({
        client: {} as any,
        userId: 'user-1'
      });

      const createdChecklist = {
        id: 'cl-2',
        tripId: 'trip-1',
        ownerId: 'user-1',
        name: 'Personal Checklist',
        type: 'personal' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        items: []
      };

      mockedCreateChecklist.mockResolvedValue(createdChecklist);

      const response = await POST(
        buildJsonRequest({ type: 'personal', name: 'Personal Checklist' }),
        { params: { tripId: 'trip-1' } }
      );

      expect(response).toBeDefined();
      expect(response?.status).toBe(200);
      const payload = await response.json();
      expect(payload).toEqual({
        success: true,
        checklist: createdChecklist
      });
      expect(mockedCreateChecklist).toHaveBeenCalledWith(
        {},
        'trip-1',
        'user-1',
        expect.objectContaining({ type: 'personal', name: 'Personal Checklist' })
      );
    });

    it('returns 400 when type is missing', async () => {
      mockedResolveRequestClient.mockResolvedValue({
        client: {} as any,
        userId: 'user-1'
      });

      const response = await POST(buildJsonRequest({}), { params: { tripId: 'trip-1' } });

      expect(response).toBeDefined();
      expect(response?.status).toBe(400);
      const payload = await response.json();
      expect(payload).toEqual({ error: 'type is required' });
      expect(mockedCreateChecklist).not.toHaveBeenCalled();
    });
  });
});

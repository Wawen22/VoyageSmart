# Testing Guide

## Overview

VoyageSmart follows a comprehensive testing strategy that includes unit tests, integration tests, and end-to-end tests. This guide covers testing frameworks, best practices, and implementation examples.

## Testing Stack

### Core Testing Libraries
- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing
- **Playwright**: End-to-end testing
- **MSW (Mock Service Worker)**: API mocking
- **Testing Library Jest DOM**: Custom Jest matchers

### Setup and Configuration

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test msw
```

### Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/api/**/*',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
import { server } from './src/__mocks__/server';

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));
```

## Unit Testing

### Component Testing

```typescript
// components/__tests__/TripCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripCard } from '../TripCard';
import { mockTrip } from '@/__mocks__/data';

describe('TripCard', () => {
  const defaultProps = {
    trip: mockTrip,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trip information correctly', () => {
    render(<TripCard {...defaultProps} />);
    
    expect(screen.getByText(mockTrip.name)).toBeInTheDocument();
    expect(screen.getByText(mockTrip.destination)).toBeInTheDocument();
    expect(screen.getByText(/June 1, 2024/)).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<TripCard {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockTrip);
  });

  it('shows confirmation dialog before delete', async () => {
    const user = userEvent.setup();
    render(<TripCard {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /delete/i }));
    
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it('handles delete confirmation', async () => {
    const user = userEvent.setup();
    render(<TripCard {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockTrip.id);
  });

  it('shows loading state during delete', async () => {
    const user = userEvent.setup();
    const slowDelete = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<TripCard {...defaultProps} onDelete={slowDelete} />);
    
    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    
    expect(screen.getByText(/deleting/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText(/deleting/i)).not.toBeInTheDocument();
    });
  });
});
```

### Hook Testing

```typescript
// hooks/__tests__/useTrips.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useTrips } from '../useTrips';
import { server } from '@/__mocks__/server';
import { rest } from 'msw';

describe('useTrips', () => {
  it('fetches trips successfully', async () => {
    const { result } = renderHook(() => useTrips('user-1'));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.trips).toEqual([]);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.trips).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error', async () => {
    server.use(
      rest.get('/api/trips', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    const { result } = renderHook(() => useTrips('user-1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toBe('Failed to fetch trips');
    expect(result.current.trips).toEqual([]);
  });

  it('refetches trips when called', async () => {
    const { result } = renderHook(() => useTrips('user-1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const initialTrips = result.current.trips;
    
    // Mock updated data
    server.use(
      rest.get('/api/trips', (req, res, ctx) => {
        return res(ctx.json([...initialTrips, { id: '3', name: 'New Trip' }]));
      })
    );
    
    await result.current.refetch();
    
    await waitFor(() => {
      expect(result.current.trips).toHaveLength(3);
    });
  });
});
```

### Utility Function Testing

```typescript
// lib/__tests__/utils.test.ts
import { formatDate, calculateTripDuration, validateEmail } from '../utils';

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-06-01T10:00:00Z');
      expect(formatDate(date)).toBe('June 1, 2024');
    });

    it('handles invalid date', () => {
      expect(formatDate(new Date('invalid'))).toBe('Invalid Date');
    });
  });

  describe('calculateTripDuration', () => {
    it('calculates duration in days', () => {
      const start = new Date('2024-06-01');
      const end = new Date('2024-06-07');
      expect(calculateTripDuration(start, end)).toBe(6);
    });

    it('returns 0 for same day', () => {
      const date = new Date('2024-06-01');
      expect(calculateTripDuration(date, date)).toBe(0);
    });
  });

  describe('validateEmail', () => {
    it('validates correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('rejects invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });
  });
});
```

## Integration Testing

### API Route Testing

```typescript
// __tests__/api/trips.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/trips/route';
import { mockUser, mockTrip } from '@/__mocks__/data';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockUser, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockTrip, error: null }))
        }))
      }))
    }))
  }
}));

describe('/api/trips', () => {
  describe('GET', () => {
    it('returns trips for authenticated user', async () => {
      const { req } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('returns 401 for unauthenticated request', async () => {
      const { req } = createMocks({
        method: 'GET'
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST', () => {
    it('creates new trip with valid data', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: {
          name: 'Test Trip',
          destination: 'Paris, France',
          startDate: '2024-06-01T00:00:00Z',
          endDate: '2024-06-07T00:00:00Z'
        }
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Test Trip');
    });

    it('returns 400 for invalid data', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: {
          name: '', // Invalid: empty name
          destination: 'Paris, France'
        }
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });
});
```

### Database Integration Testing

```typescript
// __tests__/integration/database.test.ts
import { createClient } from '@supabase/supabase-js';
import { TripService } from '@/lib/services/tripService';

// Use test database
const supabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_ANON_KEY!
);

const tripService = new TripService(supabase);

describe('Database Integration', () => {
  beforeEach(async () => {
    // Clean up test data
    await supabase.from('trips').delete().neq('id', '');
  });

  describe('TripService', () => {
    it('creates and retrieves trip', async () => {
      const tripData = {
        name: 'Integration Test Trip',
        destination: 'Test City',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-07'),
        ownerId: 'test-user-id'
      };

      const createdTrip = await tripService.createTrip(tripData);
      expect(createdTrip.id).toBeDefined();
      expect(createdTrip.name).toBe(tripData.name);

      const retrievedTrip = await tripService.getTrip(createdTrip.id);
      expect(retrievedTrip).toEqual(createdTrip);
    });

    it('enforces RLS policies', async () => {
      // Test that users can only access their own trips
      const trip1 = await tripService.createTrip({
        name: 'User 1 Trip',
        destination: 'City 1',
        ownerId: 'user-1'
      });

      const trip2 = await tripService.createTrip({
        name: 'User 2 Trip',
        destination: 'City 2',
        ownerId: 'user-2'
      });

      // User 1 should only see their trip
      const user1Trips = await tripService.getUserTrips('user-1');
      expect(user1Trips).toHaveLength(1);
      expect(user1Trips[0].id).toBe(trip1.id);

      // User 2 should only see their trip
      const user2Trips = await tripService.getUserTrips('user-2');
      expect(user2Trips).toHaveLength(1);
      expect(user2Trips[0].id).toBe(trip2.id);
    });
  });
});
```

## End-to-End Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// e2e/trip-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Trip Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('user can create a new trip', async ({ page }) => {
    await page.click('[data-testid="create-trip-button"]');
    
    await page.fill('[data-testid="trip-name"]', 'My E2E Test Trip');
    await page.fill('[data-testid="trip-destination"]', 'Tokyo, Japan');
    await page.fill('[data-testid="start-date"]', '2024-06-01');
    await page.fill('[data-testid="end-date"]', '2024-06-07');
    
    await page.click('[data-testid="submit-trip"]');
    
    await expect(page.locator('[data-testid="trip-card"]')).toContainText('My E2E Test Trip');
    await expect(page.locator('[data-testid="trip-card"]')).toContainText('Tokyo, Japan');
  });

  test('user can edit trip details', async ({ page }) => {
    // Assume trip exists
    await page.click('[data-testid="trip-card"]:first-child [data-testid="edit-button"]');
    
    await page.fill('[data-testid="trip-name"]', 'Updated Trip Name');
    await page.click('[data-testid="save-button"]');
    
    await expect(page.locator('[data-testid="trip-card"]:first-child')).toContainText('Updated Trip Name');
  });

  test('user can delete a trip', async ({ page }) => {
    await page.click('[data-testid="trip-card"]:first-child [data-testid="delete-button"]');
    await page.click('[data-testid="confirm-delete"]');
    
    await expect(page.locator('[data-testid="trip-card"]:first-child')).not.toBeVisible();
  });
});
```

### Visual Regression Testing

```typescript
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('dashboard layout', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveScreenshot('dashboard.png');
  });

  test('trip creation modal', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="create-trip-button"]');
    await expect(page.locator('[data-testid="trip-modal"]')).toHaveScreenshot('trip-modal.png');
  });

  test('mobile responsive design', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await expect(page).toHaveScreenshot('dashboard-mobile.png');
  });
});
```

## Mock Data and Services

### Mock Service Worker Setup

```typescript
// src/__mocks__/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// src/__mocks__/handlers.ts
import { rest } from 'msw';
import { mockTrips, mockUser } from './data';

export const handlers = [
  rest.get('/api/trips', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: mockTrips }));
  }),

  rest.post('/api/trips', (req, res, ctx) => {
    const newTrip = { id: '3', ...req.body };
    return res(ctx.status(201), ctx.json({ success: true, data: newTrip }));
  }),

  rest.get('/api/user', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: mockUser }));
  }),

  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(ctx.json({ success: true, token: 'mock-token' }));
  }),
];
```

### Mock Data

```typescript
// src/__mocks__/data.ts
export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  fullName: 'Test User',
  createdAt: new Date('2024-01-01')
};

export const mockTrip = {
  id: 'trip-1',
  name: 'Paris Adventure',
  destination: 'Paris, France',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-07'),
  ownerId: 'user-1',
  budget: 2000,
  currency: 'EUR'
};

export const mockTrips = [
  mockTrip,
  {
    id: 'trip-2',
    name: 'Tokyo Experience',
    destination: 'Tokyo, Japan',
    startDate: new Date('2024-08-15'),
    endDate: new Date('2024-08-22'),
    ownerId: 'user-1',
    budget: 3000,
    currency: 'JPY'
  }
];
```

## Test Utilities

### Custom Render Function

```typescript
// src/__tests__/test-utils.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AuthProvider } from '@/components/providers/AuthProvider';

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      // Add your reducers here
    },
    preloadedState: initialState,
  });
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  store?: any;
}

const AllTheProviders = ({ children, store }: { children: React.ReactNode; store: any }) => {
  return (
    <Provider store={store}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </Provider>
  );
};

const customRender = (
  ui: React.ReactElement,
  {
    initialState = {},
    store = createTestStore(initialState),
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders store={store}>{children}</AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export * from '@testing-library/react';
export { customRender as render };
```

## Performance Testing

### Load Testing with Artillery

```yaml
# artillery.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Authorization: 'Bearer test-token'

scenarios:
  - name: 'API Load Test'
    flow:
      - get:
          url: '/api/trips'
      - post:
          url: '/api/trips'
          json:
            name: 'Load Test Trip'
            destination: 'Test City'
            startDate: '2024-06-01T00:00:00Z'
            endDate: '2024-06-07T00:00:00Z'
```

## Testing Best Practices

### Test Organization

1. **Arrange, Act, Assert**: Structure tests clearly
2. **One assertion per test**: Keep tests focused
3. **Descriptive test names**: Make intent clear
4. **Test edge cases**: Cover error conditions
5. **Mock external dependencies**: Isolate units under test

### Coverage Guidelines

- **Statements**: 80% minimum
- **Branches**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### Debug Configuration

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Test Scripts

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

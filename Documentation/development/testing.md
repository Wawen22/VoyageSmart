# Testing Framework

<div align="center">
  <h3>🧪 Comprehensive Testing Guide</h3>
  <p>Complete guide to testing practices and frameworks used in VoyageSmart.</p>
</div>

---

## 🎯 Testing Philosophy

VoyageSmart follows a comprehensive testing strategy to ensure reliability, performance, and user satisfaction. Our testing approach includes multiple layers of validation to catch issues early and maintain code quality.

### Testing Pyramid

```
    🔺 E2E Tests (Few)
   🔺🔺 Integration Tests (Some)
  🔺🔺🔺 Unit Tests (Many)
```

- **Unit Tests (70%)**: Test individual functions and components
- **Integration Tests (20%)**: Test component interactions and API endpoints
- **End-to-End Tests (10%)**: Test complete user workflows

---

## 🛠️ Testing Stack

### Core Testing Tools

| Tool | Purpose | Usage |
|------|---------|-------|
| **Jest** | Test runner and framework | Unit and integration tests |
| **React Testing Library** | Component testing | UI component testing |
| **Playwright** | E2E testing | Browser automation |
| **MSW** | API mocking | Mock API responses |
| **Testing Library User Event** | User interaction simulation | User behavior testing |

### Additional Tools

- **@testing-library/jest-dom** - Custom Jest matchers
- **jest-environment-jsdom** - DOM environment for tests
- **@playwright/test** - Playwright test framework
- **supertest** - API endpoint testing
- **nock** - HTTP request mocking

---

## 🧪 Unit Testing

### Component Testing

```typescript
// Example: TripCard component test
import { render, screen, fireEvent } from '@testing-library/react';
import { TripCard } from '../TripCard';

const mockTrip = {
  id: '1',
  name: 'Summer Vacation',
  destination: 'Rome, Italy',
  startDate: '2024-07-15',
  endDate: '2024-07-22',
  budget: 2500
};

describe('TripCard', () => {
  it('should display trip information correctly', () => {
    render(<TripCard trip={mockTrip} />);
    
    expect(screen.getByText('Summer Vacation')).toBeInTheDocument();
    expect(screen.getByText('Rome, Italy')).toBeInTheDocument();
    expect(screen.getByText('€2,500')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    render(<TripCard trip={mockTrip} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockTrip.id);
  });
});
```

### Hook Testing

```typescript
// Example: useTrips hook test
import { renderHook, waitFor } from '@testing-library/react';
import { useTrips } from '../useTrips';

// Mock the API
jest.mock('../api/trips', () => ({
  fetchTrips: jest.fn()
}));

describe('useTrips', () => {
  it('should fetch trips on mount', async () => {
    const mockTrips = [mockTrip];
    (fetchTrips as jest.Mock).mockResolvedValue(mockTrips);

    const { result } = renderHook(() => useTrips());

    await waitFor(() => {
      expect(result.current.trips).toEqual(mockTrips);
      expect(result.current.loading).toBe(false);
    });
  });
});
```

### Utility Function Testing

```typescript
// Example: date utility test
import { formatTripDuration, calculateDaysBetween } from '../dateUtils';

describe('dateUtils', () => {
  describe('calculateDaysBetween', () => {
    it('should calculate days between two dates', () => {
      const startDate = '2024-07-15';
      const endDate = '2024-07-22';
      
      const result = calculateDaysBetween(startDate, endDate);
      
      expect(result).toBe(7);
    });

    it('should handle same date', () => {
      const date = '2024-07-15';
      
      const result = calculateDaysBetween(date, date);
      
      expect(result).toBe(0);
    });
  });
});
```

---

## 🔗 Integration Testing

### API Route Testing

```typescript
// Example: API route test
import { createMocks } from 'node-mocks-http';
import handler from '../pages/api/trips';

describe('/api/trips', () => {
  it('should return trips for authenticated user', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      data: expect.any(Array)
    });
  });

  it('should return 401 for unauthenticated requests', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });
});
```

### Database Integration Testing

```typescript
// Example: database integration test
import { createTrip, getTrip } from '../lib/database/trips';
import { setupTestDatabase, cleanupTestDatabase } from '../test-utils/database';

describe('Trip Database Operations', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should create and retrieve a trip', async () => {
    const tripData = {
      name: 'Test Trip',
      destination: 'Test Destination',
      startDate: '2024-07-15',
      endDate: '2024-07-22',
      userId: 'test-user-id'
    };

    const createdTrip = await createTrip(tripData);
    const retrievedTrip = await getTrip(createdTrip.id);

    expect(retrievedTrip).toMatchObject(tripData);
  });
});
```

---

## 🌐 End-to-End Testing

### Playwright E2E Tests

```typescript
// Example: E2E test for trip creation
import { test, expect } from '@playwright/test';

test.describe('Trip Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new trip successfully', async ({ page }) => {
    // Navigate to create trip page
    await page.click('[data-testid="create-trip-button"]');
    await expect(page).toHaveURL('/trips/create');

    // Fill trip form
    await page.fill('[data-testid="trip-name"]', 'Summer Vacation 2024');
    await page.fill('[data-testid="destination"]', 'Rome, Italy');
    await page.fill('[data-testid="start-date"]', '2024-07-15');
    await page.fill('[data-testid="end-date"]', '2024-07-22');
    await page.fill('[data-testid="budget"]', '2500');

    // Submit form
    await page.click('[data-testid="create-trip-submit"]');

    // Verify trip was created
    await expect(page).toHaveURL(/\/trips\/[a-zA-Z0-9-]+/);
    await expect(page.locator('[data-testid="trip-name"]')).toContainText('Summer Vacation 2024');
  });

  test('should show validation errors for invalid data', async ({ page }) => {
    await page.click('[data-testid="create-trip-button"]');
    
    // Submit empty form
    await page.click('[data-testid="create-trip-submit"]');

    // Check for validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="destination-error"]')).toBeVisible();
  });
});
```

### Visual Regression Testing

```typescript
// Example: visual regression test
import { test, expect } from '@playwright/test';

test('trip dashboard visual regression', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Wait for content to load
  await page.waitForSelector('[data-testid="trips-grid"]');
  
  // Take screenshot and compare
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

---

## 🎭 Mocking & Test Data

### API Mocking with MSW

```typescript
// test-utils/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/trips', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [
          {
            id: '1',
            name: 'Test Trip',
            destination: 'Test Destination'
          }
        ]
      })
    );
  }),

  rest.post('/api/trips', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          id: '2',
          ...req.body
        }
      })
    );
  })
];
```

### Test Data Factories

```typescript
// test-utils/factories.ts
export const createMockTrip = (overrides = {}) => ({
  id: '1',
  name: 'Test Trip',
  destination: 'Test Destination',
  startDate: '2024-07-15',
  endDate: '2024-07-22',
  budget: 1000,
  currency: 'EUR',
  status: 'planning',
  createdAt: '2024-01-15T10:00:00Z',
  ...overrides
});

export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides
});
```

---

## 📊 Test Coverage

### Coverage Requirements

- **Minimum Coverage**: 80% overall
- **Critical Paths**: 95% coverage
- **New Features**: 90% coverage
- **Bug Fixes**: 100% coverage for fixed code

### Coverage Commands

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
npm run test:coverage:open

# Coverage for specific files
npm run test:coverage -- --testPathPattern=trips
```

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/test-utils/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lib/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

---

## 🚀 Test Automation

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "npm run test:related",
      "git add"
    ]
  }
}
```

---

## 🔧 Test Utilities

### Custom Render Function

```typescript
// test-utils/render.tsx
import { render as rtlRender } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../src/store';

function render(ui: React.ReactElement, options = {}) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }
  
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
export { render };
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- TripCard.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should create trip"

# Run tests for changed files
npm run test:changed

# Debug tests
npm run test:debug
```

---

## 📝 Best Practices

### Writing Good Tests

1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Single Responsibility**: Test one thing at a time
4. **Independent Tests**: Tests should not depend on each other
5. **Fast Execution**: Keep tests fast and focused

### Test Organization

```
src/
├── components/
│   ├── TripCard/
│   │   ├── TripCard.tsx
│   │   ├── TripCard.test.tsx
│   │   └── index.ts
│   └── __tests__/
│       └── integration/
├── hooks/
│   ├── useTrips.ts
│   └── useTrips.test.ts
└── __tests__/
    ├── e2e/
    ├── integration/
    └── utils/
```

### Common Patterns

```typescript
// Test data setup
const setup = (props = {}) => {
  const defaultProps = {
    trip: createMockTrip(),
    onEdit: jest.fn(),
    onDelete: jest.fn()
  };
  
  return render(<TripCard {...defaultProps} {...props} />);
};

// Async testing
it('should handle async operations', async () => {
  const promise = fetchTrips();
  
  await waitFor(() => {
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  await waitFor(() => {
    expect(screen.getByText('Trip Name')).toBeInTheDocument();
  });
});
```

---

## 🔗 Related Documentation

- **[Code Standards](./code-standards.md)** - Coding guidelines and standards
- **[Contributing](./contributing.md)** - How to contribute to the project
- **[Security](./security-implementations.md)** - Security testing practices

---

<div align="center">
  <p>
    <a href="./code-standards.md">← Back to Code Standards</a> •
    <a href="./security-implementations.md">Next: Security →</a>
  </p>
</div>

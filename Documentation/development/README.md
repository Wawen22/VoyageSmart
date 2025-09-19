# Development Guide

## Overview

This guide provides comprehensive information for developers working on VoyageSmart. It covers development setup, coding standards, testing practices, and contribution guidelines.

## Getting Started

### Prerequisites

Before you begin development, ensure you have the following installed:

- **Node.js 18+**: JavaScript runtime
- **npm or yarn**: Package manager
- **Git**: Version control
- **VS Code**: Recommended IDE with extensions
- **Docker** (optional): For local database setup

### Development Environment Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Wawen22/VoyageSmart.git
   cd VoyageSmart
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure Environment Variables**
   Edit `.env.local` with your configuration:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # AI Configuration
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
   NEXT_PUBLIC_AI_DEFAULT_PROVIDER=gemini
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   
   # Other Services
   RESEND_API_KEY=your_resend_key
   MAPBOX_ACCESS_TOKEN=your_mapbox_token
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

## Project Structure

### Directory Organization

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Dashboard pages
│   ├── trips/             # Trip management
│   ├── documentation/     # Documentation pages
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── [feature]/        # Feature-specific components
├── lib/                  # Business logic
│   ├── features/         # Redux slices
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   ├── hooks/            # Custom hooks
│   └── types/            # Type definitions
├── hooks/                # Custom React hooks
├── styles/               # Additional styles
└── __tests__/            # Test files
```

### File Naming Conventions

- **Components**: PascalCase (`TripCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: PascalCase (`Trip.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

## Development Workflow

### Git Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/trip-management
   ```

2. **Make Changes**
   - Follow coding standards
   - Write tests for new features
   - Update documentation

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add trip creation functionality"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/trip-management
   ```

### Commit Message Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add password reset functionality
fix(trips): resolve date validation issue
docs(api): update authentication endpoints
```

## Code Quality

### ESLint Configuration

```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### TypeScript Guidelines

1. **Use Strict Types**
   ```typescript
   // Good
   interface Trip {
     id: string;
     name: string;
     startDate: Date;
   }
   
   // Avoid
   interface Trip {
     id: any;
     name: any;
     startDate: any;
   }
   ```

2. **Prefer Interfaces over Types**
   ```typescript
   // Preferred
   interface UserProps {
     name: string;
     email: string;
   }
   
   // Use for unions/intersections
   type Status = 'loading' | 'success' | 'error';
   ```

3. **Use Generics for Reusability**
   ```typescript
   interface ApiResponse<T> {
     data: T;
     success: boolean;
     error?: string;
   }
   ```

## Testing Strategy

### Testing Framework Setup

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Unit Testing

```typescript
// components/__tests__/TripCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TripCard } from '../TripCard';

describe('TripCard', () => {
  const mockTrip = {
    id: '1',
    name: 'Paris Adventure',
    destination: 'Paris, France',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-07')
  };

  it('renders trip information correctly', () => {
    render(<TripCard trip={mockTrip} />);
    
    expect(screen.getByText('Paris Adventure')).toBeInTheDocument();
    expect(screen.getByText('Paris, France')).toBeInTheDocument();
  });

  it('handles edit action', () => {
    const onEdit = jest.fn();
    render(<TripCard trip={mockTrip} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockTrip);
  });
});
```

### Integration Testing

```typescript
// __tests__/api/trips.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../src/app/api/trips/route';

describe('/api/trips', () => {
  it('creates a new trip', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Test Trip',
        destination: 'Test Destination',
        startDate: '2024-06-01',
        endDate: '2024-06-07'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Test Trip');
  });
});
```

### E2E Testing with Playwright

```typescript
// e2e/trip-creation.spec.ts
import { test, expect } from '@playwright/test';

test('user can create a new trip', async ({ page }) => {
  await page.goto('/dashboard');
  
  await page.click('[data-testid="create-trip-button"]');
  await page.fill('[data-testid="trip-name"]', 'My Test Trip');
  await page.fill('[data-testid="trip-destination"]', 'Tokyo, Japan');
  await page.click('[data-testid="submit-trip"]');
  
  await expect(page.locator('[data-testid="trip-card"]')).toContainText('My Test Trip');
});
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy load heavy components
import { lazy, Suspense } from 'react';

const ExpenseChart = lazy(() => import('./ExpenseChart'));
const ItineraryMap = lazy(() => import('./ItineraryMap'));

function TripDashboard() {
  return (
    <div>
      <Suspense fallback={<div>Loading chart...</div>}>
        <ExpenseChart />
      </Suspense>
      <Suspense fallback={<div>Loading map...</div>}>
        <ItineraryMap />
      </Suspense>
    </div>
  );
}
```

### Image Optimization

```typescript
import Image from 'next/image';

function TripImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      priority={false}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npm run analyze
```

## Debugging

### Development Tools

1. **React Developer Tools**
   - Install browser extension
   - Inspect component state and props

2. **Redux DevTools**
   - Monitor state changes
   - Time-travel debugging

3. **Next.js Debugging**
   ```json
   // .vscode/launch.json
   {
     "type": "node",
     "request": "launch",
     "name": "Next.js: debug server-side",
     "program": "${workspaceFolder}/node_modules/.bin/next",
     "args": ["dev"],
     "console": "integratedTerminal"
   }
   ```

### Logging

```typescript
// lib/logger.ts
export const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  },
  
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data);
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
    // Send to error tracking service in production
  }
};
```

## API Development

### API Route Structure

```typescript
// app/api/trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createTripSchema = z.object({
  name: z.string().min(1).max(100),
  destination: z.string().min(1).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTripSchema.parse(body);
    
    // Business logic here
    const trip = await createTrip(validatedData);
    
    return NextResponse.json({
      success: true,
      data: trip
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

### Error Handling

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}
```

## Database Development

### Migration Guidelines

```sql
-- migrations/001_create_trips_table.sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  destination TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trips" ON trips
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create trips" ON trips
  FOR INSERT WITH CHECK (owner_id = auth.uid());
```

### Query Optimization

```typescript
// Efficient data fetching
export async function getTripWithDetails(tripId: string) {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      accommodations(*),
      transportation(*),
      itinerary_days(
        *,
        activities(*)
      ),
      expenses(
        *,
        expense_participants(*)
      )
    `)
    .eq('id', tripId)
    .single();
    
  if (error) throw error;
  return data;
}
```

## Deployment

### Build Process

```bash
# Production build
npm run build

# Start production server
npm start

# Export static site (if applicable)
npm run export
```

### Environment Variables

```bash
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=your-stripe-secret-key
RESEND_API_KEY=your-resend-key
```

### Vercel Deployment

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

## Contributing

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Update documentation
7. Submit a pull request

### Code Review Guidelines

- **Functionality**: Does the code work as intended?
- **Performance**: Are there any performance implications?
- **Security**: Are there any security vulnerabilities?
- **Maintainability**: Is the code readable and maintainable?
- **Testing**: Are there adequate tests?
- **Documentation**: Is the code properly documented?

### Issue Reporting

When reporting issues, please include:

- **Description**: Clear description of the problem
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: Browser, OS, Node.js version
- **Screenshots**: If applicable

## Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [Postman](https://www.postman.com/) for API testing

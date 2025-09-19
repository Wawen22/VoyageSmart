# Code Standards

## Overview

This document outlines the coding standards and best practices for VoyageSmart development. Following these standards ensures code consistency, maintainability, and team collaboration.

## General Principles

### 1. Consistency
- Follow established patterns throughout the codebase
- Use consistent naming conventions
- Maintain consistent file structure

### 2. Readability
- Write self-documenting code
- Use meaningful variable and function names
- Add comments for complex logic

### 3. Maintainability
- Keep functions small and focused
- Avoid deep nesting
- Use composition over inheritance

### 4. Performance
- Optimize for user experience
- Minimize bundle size
- Use efficient algorithms and data structures

## TypeScript Standards

### Type Definitions

```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
}

// Use type aliases for unions and primitives
type Status = 'loading' | 'success' | 'error';
type UserId = string;

// Use generics for reusable types
interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}
```

### Naming Conventions

```typescript
// Interfaces: PascalCase
interface TripDetails {
  name: string;
  destination: string;
}

// Types: PascalCase
type TripStatus = 'draft' | 'active' | 'completed';

// Variables and functions: camelCase
const tripCount = 5;
const getUserTrips = () => {};

// Constants: UPPER_SNAKE_CASE
const MAX_TRIP_DURATION = 365;
const API_ENDPOINTS = {
  TRIPS: '/api/trips',
  USERS: '/api/users'
};

// Classes: PascalCase
class TripService {
  private apiClient: ApiClient;
}

// Enums: PascalCase
enum TripType {
  BUSINESS = 'business',
  LEISURE = 'leisure',
  ADVENTURE = 'adventure'
}
```

### Function Standards

```typescript
// Use arrow functions for simple operations
const formatDate = (date: Date): string => {
  return date.toLocaleDateString();
};

// Use function declarations for complex operations
function calculateTripExpenses(expenses: Expense[]): ExpenseSummary {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const byCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  
  return { total, byCategory };
}

// Use async/await instead of promises
async function fetchUserTrips(userId: string): Promise<Trip[]> {
  try {
    const response = await api.get(`/users/${userId}/trips`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch trips:', error);
    throw new Error('Unable to load trips');
  }
}
```

## React Standards

### Component Structure

```typescript
// Component file structure
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { Trip } from '@/lib/types';

interface TripCardProps {
  trip: Trip;
  onEdit?: (trip: Trip) => void;
  onDelete?: (tripId: string) => void;
}

export function TripCard({ trip, onEdit, onDelete }: TripCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleEdit = () => {
    onEdit?.(trip);
  };
  
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete?.(trip.id);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="trip-card">
      <h3>{trip.name}</h3>
      <p>{trip.destination}</p>
      <p>{formatDate(trip.startDate)}</p>
      
      <div className="actions">
        <Button onClick={handleEdit}>Edit</Button>
        <Button 
          variant="destructive" 
          onClick={handleDelete}
          disabled={isLoading}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

export default TripCard;
```

### Hooks Standards

```typescript
// Custom hook naming: use prefix
export function useTrips(userId: string) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchTrips() {
      try {
        setLoading(true);
        setError(null);
        const data = await tripService.getUserTrips(userId);
        setTrips(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) {
      fetchTrips();
    }
  }, [userId]);
  
  return { trips, loading, error, refetch: () => fetchTrips() };
}
```

### State Management

```typescript
// Redux slice structure
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface TripsState {
  trips: Trip[];
  currentTrip: Trip | null;
  loading: boolean;
  error: string | null;
}

const initialState: TripsState = {
  trips: [],
  currentTrip: null,
  loading: false,
  error: null
};

export const fetchTrips = createAsyncThunk(
  'trips/fetchTrips',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await tripService.getUserTrips(userId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const tripsSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    setCurrentTrip: (state, action: PayloadAction<Trip>) => {
      state.currentTrip = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.trips = action.payload;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setCurrentTrip, clearError } = tripsSlice.actions;
export default tripsSlice.reducer;
```

## CSS/Styling Standards

### Tailwind CSS Guidelines

```typescript
// Use semantic class groupings
<div className="
  flex items-center justify-between
  p-4 mb-4
  bg-white border border-gray-200 rounded-lg
  shadow-sm hover:shadow-md
  transition-shadow duration-200
">
  <h3 className="text-lg font-semibold text-gray-900">
    Trip Title
  </h3>
  <Button className="ml-4">
    Edit
  </Button>
</div>

// Use component variants with class-variance-authority
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);
```

### CSS Custom Properties

```css
/* Use CSS custom properties for theming */
:root {
  --color-primary: 59 130 246;
  --color-primary-foreground: 255 255 255;
  --color-secondary: 244 244 245;
  --color-secondary-foreground: 39 39 42;
  
  --border-radius: 0.5rem;
  --font-sans: 'Inter', sans-serif;
}

.dark {
  --color-primary: 147 197 253;
  --color-primary-foreground: 30 41 59;
}
```

## API Standards

### Route Structure

```typescript
// API route naming: kebab-case
// GET /api/trips
// POST /api/trips
// GET /api/trips/[id]
// PUT /api/trips/[id]
// DELETE /api/trips/[id]

// Nested resources
// GET /api/trips/[id]/expenses
// POST /api/trips/[id]/expenses

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id;
    
    // Validate input
    if (!tripId || typeof tripId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid trip ID' },
        { status: 400 }
      );
    }
    
    // Business logic
    const trip = await tripService.getTrip(tripId);
    
    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Response Format

```typescript
// Success response
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Error response
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// Usage
return NextResponse.json({
  success: true,
  data: trips,
  meta: {
    total: trips.length,
    page: 1,
    limit: 10
  }
});
```

## Error Handling Standards

### Error Classes

```typescript
// Custom error classes
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

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}
```

### Error Handling Patterns

```typescript
// Service layer error handling
export class TripService {
  async getTrip(id: string): Promise<Trip> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!data) {
        throw new NotFoundError('Trip');
      }
      
      return data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Unexpected error in getTrip:', error);
      throw new AppError('Failed to retrieve trip');
    }
  }
}

// Component error handling
function TripDetails({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadTrip() {
      try {
        setError(null);
        const tripData = await tripService.getTrip(tripId);
        setTrip(tripData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
      }
    }
    
    loadTrip();
  }, [tripId]);
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  if (!trip) {
    return <LoadingSpinner />;
  }
  
  return <TripCard trip={trip} />;
}
```

## Testing Standards

### Unit Test Structure

```typescript
// Test file naming: ComponentName.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TripCard } from './TripCard';

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

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<TripCard trip={mockTrip} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockTrip);
  });

  it('handles loading state during delete', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    render(<TripCard trip={mockTrip} onDelete={onDelete} />);
    
    fireEvent.click(screen.getByText('Delete'));
    
    expect(screen.getByText('Delete')).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByText('Delete')).not.toBeDisabled();
    });
  });
});
```

### Test Utilities

```typescript
// test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## Documentation Standards

### Code Comments

```typescript
/**
 * Calculates the total cost of a trip including all expenses
 * @param expenses - Array of expense objects
 * @param currency - Target currency for conversion
 * @returns Total cost in the specified currency
 */
function calculateTripCost(
  expenses: Expense[], 
  currency: string = 'USD'
): number {
  // Group expenses by currency for batch conversion
  const expensesByCurrency = expenses.reduce((acc, expense) => {
    if (!acc[expense.currency]) {
      acc[expense.currency] = [];
    }
    acc[expense.currency].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);
  
  // Convert and sum all expenses
  let total = 0;
  for (const [expenseCurrency, currencyExpenses] of Object.entries(expensesByCurrency)) {
    const subtotal = currencyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    total += convertCurrency(subtotal, expenseCurrency, currency);
  }
  
  return total;
}
```

### README Structure

```markdown
# Component/Feature Name

## Overview
Brief description of the component or feature.

## Usage
```typescript
import { ComponentName } from './ComponentName';

<ComponentName prop1="value1" prop2="value2" />
```

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description of prop1 |
| prop2 | number | 0 | Description of prop2 |

## Examples
Provide usage examples with different configurations.

## Notes
Any important notes or considerations.
```

## Performance Standards

### Optimization Guidelines

```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }: { data: ComplexData }) => {
  return <div>{/* Complex rendering logic */}</div>;
});

// Use useMemo for expensive calculations
function TripSummary({ expenses }: { expenses: Expense[] }) {
  const summary = useMemo(() => {
    return calculateExpenseSummary(expenses);
  }, [expenses]);
  
  return <div>{summary.total}</div>;
}

// Use useCallback for event handlers
function TripList({ trips, onTripSelect }: TripListProps) {
  const handleTripClick = useCallback((trip: Trip) => {
    onTripSelect(trip);
  }, [onTripSelect]);
  
  return (
    <div>
      {trips.map(trip => (
        <TripCard 
          key={trip.id} 
          trip={trip} 
          onClick={handleTripClick}
        />
      ))}
    </div>
  );
}
```

## Security Standards

### Input Validation

```typescript
// Always validate user input
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
    
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }
  }
}
```

### Authentication Checks

```typescript
// Always verify authentication in protected routes
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Continue with authenticated logic
}
```

## Code Review Checklist

### Before Submitting PR

- [ ] Code follows established patterns
- [ ] All functions have proper TypeScript types
- [ ] Error handling is implemented
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] Security considerations are addressed
- [ ] Performance implications are considered

### Review Criteria

- [ ] **Functionality**: Does the code work as intended?
- [ ] **Readability**: Is the code easy to understand?
- [ ] **Maintainability**: Will this be easy to modify later?
- [ ] **Performance**: Are there any performance concerns?
- [ ] **Security**: Are there any security vulnerabilities?
- [ ] **Testing**: Is the code adequately tested?
- [ ] **Standards**: Does the code follow our standards?

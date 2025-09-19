# Frontend Architecture

## Overview

VoyageSmart's frontend is built with Next.js 15 using the App Router, TypeScript, and modern React patterns. The architecture emphasizes component reusability, type safety, and optimal user experience.

## Technology Stack

### Core Technologies
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **React 18**: UI library with concurrent features
- **Tailwind CSS**: Utility-first CSS framework
- **Redux Toolkit**: State management
- **Radix UI**: Accessible component primitives

### Supporting Libraries
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **Date-fns**: Date manipulation
- **Lucide React**: Icon library
- **Framer Motion**: Animations
- **React Query**: Server state management (planned)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── dashboard/         # Dashboard pages
│   ├── trips/             # Trip management pages
│   ├── documentation/     # Documentation pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   ├── trip/             # Trip-specific components
│   └── documentation/    # Documentation components
├── lib/                  # Business logic
│   ├── features/         # Redux slices
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   ├── hooks/            # Custom hooks
│   └── types/            # Type definitions
├── hooks/                # Custom React hooks
└── styles/               # Additional styles
```

## Component Architecture

### Component Hierarchy

```
App Layout
├── Navigation
├── Sidebar (conditional)
├── Main Content
│   ├── Page Header
│   ├── Page Content
│   │   ├── Feature Components
│   │   ├── Form Components
│   │   └── Data Display Components
│   └── Modals/Dialogs
└── Footer
```

### Component Categories

#### 1. UI Components (`/components/ui/`)
Base components following design system principles:

```typescript
// Button component with variants
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      {...props}
    />
  );
}
```

#### 2. Form Components (`/components/forms/`)
Reusable form components with validation:

```typescript
// Form field with validation
interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number';
  validation?: ZodSchema;
  placeholder?: string;
}

export function FormField({ name, label, validation, ...props }: FormFieldProps) {
  const { register, formState: { errors } } = useFormContext();
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        {...register(name, validation)}
        {...props}
      />
      {errors[name] && (
        <p className="text-sm text-destructive">{errors[name]?.message}</p>
      )}
    </div>
  );
}
```

#### 3. Feature Components (`/components/trip/`, etc.)
Business logic components for specific features:

```typescript
// Trip card component
interface TripCardProps {
  trip: Trip;
  onEdit?: (trip: Trip) => void;
  onDelete?: (tripId: string) => void;
}

export function TripCard({ trip, onEdit, onDelete }: TripCardProps) {
  const { user } = useAuth();
  const canEdit = trip.owner_id === user?.id;
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{trip.name}</CardTitle>
        <CardDescription>{trip.destination}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Trip details */}
      </CardContent>
      {canEdit && (
        <CardFooter>
          <Button onClick={() => onEdit?.(trip)}>Edit</Button>
          <Button variant="destructive" onClick={() => onDelete?.(trip.id)}>
            Delete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
```

## State Management

### Redux Toolkit Structure

```typescript
// Store configuration
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    trips: tripsSlice.reducer,
    accommodations: accommodationsSlice.reducer,
    transportation: transportationSlice.reducer,
    expenses: expensesSlice.reducer,
    itinerary: itinerarySlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});
```

### Slice Pattern

```typescript
// Trip slice example
interface TripsState {
  trips: Trip[];
  currentTrip: Trip | null;
  loading: boolean;
  error: string | null;
}

const tripsSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    setCurrentTrip: (state, action: PayloadAction<Trip>) => {
      state.currentTrip = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
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
        state.error = action.error.message || 'Failed to fetch trips';
      });
  },
});
```

## Routing Architecture

### App Router Structure

```
app/
├── (auth)/                # Auth route group
│   ├── login/
│   ├── register/
│   └── layout.tsx
├── dashboard/
│   └── page.tsx
├── trips/
│   ├── page.tsx           # Trip list
│   ├── new/
│   │   └── page.tsx       # Create trip
│   └── [id]/              # Dynamic trip routes
│       ├── page.tsx       # Trip details
│       ├── itinerary/
│       ├── accommodations/
│       ├── transportation/
│       └── expenses/
├── documentation/
│   ├── page.tsx
│   ├── [section]/
│   │   ├── page.tsx
│   │   └── [file]/
│   │       └── page.tsx
└── layout.tsx             # Root layout
```

### Route Protection

```typescript
// Middleware for route protection
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes
  const publicRoutes = ['/', '/login', '/register', '/documentation'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check authentication
  const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

## Custom Hooks

### Authentication Hook

```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return { user, loading, signIn, signOut, signUp };
}
```

### Data Fetching Hook

```typescript
export function useTrips() {
  const dispatch = useAppDispatch();
  const { trips, loading, error } = useAppSelector(state => state.trips);
  
  const fetchTrips = useCallback(() => {
    dispatch(fetchTripsAsync());
  }, [dispatch]);
  
  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);
  
  return { trips, loading, error, refetch: fetchTrips };
}
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy loading components
const ExpenseModal = lazy(() => import('./ExpenseModal'));
const ItineraryMap = lazy(() => import('./ItineraryMap'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <ExpenseModal />
</Suspense>
```

### Memoization

```typescript
// Memoized expensive calculations
const expensesSummary = useMemo(() => {
  return expenses.reduce((acc, expense) => {
    acc.total += expense.amount;
    acc.byCategory[expense.category] = (acc.byCategory[expense.category] || 0) + expense.amount;
    return acc;
  }, { total: 0, byCategory: {} });
}, [expenses]);

// Memoized components
const TripCard = memo(({ trip, onEdit, onDelete }: TripCardProps) => {
  // Component implementation
});
```

### Image Optimization

```typescript
// Next.js Image component
import Image from 'next/image';

<Image
  src="/trip-placeholder.jpg"
  alt="Trip destination"
  width={400}
  height={300}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

## Styling Architecture

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
```

### Component Variants

```typescript
// Using class-variance-authority for component variants
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

## Error Handling

### Error Boundaries

```typescript
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    
    return this.props.children;
  }
}
```

### API Error Handling

```typescript
// Centralized error handling
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}
```

## Testing Strategy

### Component Testing

```typescript
// Jest + React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { TripCard } from './TripCard';

describe('TripCard', () => {
  const mockTrip = {
    id: '1',
    name: 'Test Trip',
    destination: 'Paris',
    owner_id: 'user-1',
  };
  
  it('renders trip information', () => {
    render(<TripCard trip={mockTrip} />);
    
    expect(screen.getByText('Test Trip')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<TripCard trip={mockTrip} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockTrip);
  });
});
```

## Accessibility

### ARIA Implementation

```typescript
// Accessible modal component
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <DialogHeader>
          <DialogTitle id="modal-title">{title}</DialogTitle>
        </DialogHeader>
        <div id="modal-description">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
```

### Keyboard Navigation

```typescript
// Keyboard navigation support
export function NavigationMenu() {
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        // Navigate to next item
        break;
      case 'ArrowUp':
        // Navigate to previous item
        break;
      case 'Enter':
      case ' ':
        // Activate current item
        break;
    }
  };
  
  return (
    <nav onKeyDown={handleKeyDown} role="navigation">
      {/* Navigation items */}
    </nav>
  );
}
```

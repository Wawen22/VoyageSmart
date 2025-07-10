# Frontend Architecture

VoyageSmart's frontend is built with modern React patterns and Next.js 15, providing a fast, responsive, and maintainable user experience.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Architecture                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Presentation  │    │   Application   │    │   Data Layer    │
│     Layer       │    │     Layer       │    │                 │
│                 │    │                 │    │                 │
│  - React        │    │  - Redux Store  │    │  - RTK Query    │
│  - Components   │◄──►│  - Slices       │◄──►│  - API Calls    │
│  - Pages        │    │  - Middleware   │    │  - Cache        │
│  - Layouts      │    │  - Selectors    │    │  - Supabase     │
│  - UI Library   │    │  - Actions      │    │  - Local State  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Styling       │    │   Routing       │    │   Utils         │
│                 │    │                 │    │                 │
│  - Tailwind CSS │    │  - App Router   │    │  - Helpers      │
│  - CSS Modules  │    │  - Dynamic      │    │  - Validators   │
│  - Animations   │    │  - Middleware   │    │  - Constants    │
│  - Themes       │    │  - Layouts      │    │  - Types        │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Technology Stack

### Core Technologies

- **React 18**: Modern React with concurrent features
- **Next.js 15**: Full-stack React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework

### State Management

- **Redux Toolkit**: Predictable state management
- **RTK Query**: Data fetching and caching
- **React Context**: Component-level state sharing
- **Local State**: Component-specific state with useState/useReducer

### UI & Styling

- **Tailwind CSS**: Primary styling framework
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations
- **Lucide React**: Icon library
- **next-themes**: Dark/light theme support

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Dashboard pages
│   ├── trips/             # Trip-related pages
│   ├── documentation/     # Documentation pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
│
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── forms/            # Form components
│   ├── trip/             # Trip-specific components
│   ├── documentation/    # Documentation components
│   └── providers/        # Context providers
│
├── lib/                  # Utility libraries
│   ├── features/         # Redux slices
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Helper functions
│   ├── validations/      # Form validation schemas
│   ├── store.ts          # Redux store configuration
│   ├── supabase.ts       # Supabase client
│   └── config.ts         # App configuration
│
├── styles/               # Styling files
│   ├── globals.css       # Global styles
│   ├── animations.css    # Animation definitions
│   └── components.css    # Component-specific styles
│
└── types/                # TypeScript type definitions
    ├── database.ts       # Database types
    ├── api.ts           # API response types
    └── global.ts        # Global types
```

## 🎯 Component Architecture

### Component Hierarchy

```
App Layout
├── Navbar
├── Main Content
│   ├── Page Layout
│   │   ├── Page Header
│   │   ├── Page Content
│   │   │   ├── Feature Components
│   │   │   │   ├── UI Components
│   │   │   │   └── Form Components
│   │   │   └── Data Components
│   │   └── Page Footer
│   └── Modals/Dialogs
├── Mobile Navbar
└── Global Providers
```

### Component Types

#### 1. Layout Components
```typescript
// Layout components handle page structure
interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function DashboardLayout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header title={title} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

#### 2. UI Components
```typescript
// Reusable UI components with consistent styling
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', size = 'md', children, onClick }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors',
        variants[variant],
        sizes[size]
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

#### 3. Feature Components
```typescript
// Feature-specific components with business logic
interface TripCardProps {
  trip: Trip;
  onEdit: (trip: Trip) => void;
  onDelete: (tripId: string) => void;
}

export function TripCard({ trip, onEdit, onDelete }: TripCardProps) {
  const dispatch = useAppDispatch();
  
  const handleEdit = () => {
    dispatch(setCurrentTrip(trip));
    onEdit(trip);
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>{trip.name}</CardTitle>
        <CardDescription>{trip.destination}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Trip details */}
      </CardContent>
      <CardActions>
        <Button onClick={handleEdit}>Edit</Button>
        <Button variant="outline" onClick={() => onDelete(trip.id)}>
          Delete
        </Button>
      </CardActions>
    </Card>
  );
}
```

## 🔄 State Management

### Redux Store Structure

```typescript
// Store configuration
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    trips: tripsSlice.reducer,
    itinerary: itinerarySlice.reducer,
    expenses: expensesSlice.reducer,
    accommodations: accommodationsSlice.reducer,
    transportation: transportationSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(api.middleware),
});
```

### State Slices

#### Auth Slice
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});
```

#### Trip Slice
```typescript
interface TripState {
  trips: Trip[];
  currentTrip: Trip | null;
  loading: boolean;
  error: string | null;
}

const tripSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    setTrips: (state, action) => {
      state.trips = action.payload;
    },
    setCurrentTrip: (state, action) => {
      state.currentTrip = action.payload;
    },
    addTrip: (state, action) => {
      state.trips.push(action.payload);
    },
    updateTrip: (state, action) => {
      const index = state.trips.findIndex(trip => trip.id === action.payload.id);
      if (index !== -1) {
        state.trips[index] = action.payload;
      }
    },
    removeTrip: (state, action) => {
      state.trips = state.trips.filter(trip => trip.id !== action.payload);
    },
  },
});
```

### RTK Query API

```typescript
// API slice for data fetching
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Trip', 'Activity', 'Expense', 'User'],
  endpoints: (builder) => ({
    getTrips: builder.query<Trip[], void>({
      query: () => 'trips',
      providesTags: ['Trip'],
    }),
    getTripById: builder.query<Trip, string>({
      query: (id) => `trips/${id}`,
      providesTags: (result, error, id) => [{ type: 'Trip', id }],
    }),
    createTrip: builder.mutation<Trip, Partial<Trip>>({
      query: (trip) => ({
        url: 'trips',
        method: 'POST',
        body: trip,
      }),
      invalidatesTags: ['Trip'],
    }),
    updateTrip: builder.mutation<Trip, { id: string; trip: Partial<Trip> }>({
      query: ({ id, trip }) => ({
        url: `trips/${id}`,
        method: 'PUT',
        body: trip,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Trip', id }],
    }),
  }),
});
```

## 🎨 Styling Architecture

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### CSS Custom Properties

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 84% 4.9%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --border: 217.2 32.6% 17.5%;
}
```

## 🔗 Routing Architecture

### App Router Structure

```typescript
// app/layout.tsx - Root layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          {children}
          <MobileNavbar />
        </Providers>
      </body>
    </html>
  );
}

// app/dashboard/layout.tsx - Dashboard layout
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:pl-64">
        {children}
      </main>
    </div>
  );
}
```

### Dynamic Routes

```typescript
// app/trips/[id]/page.tsx
interface TripPageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

export default function TripPage({ params, searchParams }: TripPageProps) {
  const { id } = params;
  const { tab = 'overview' } = searchParams;
  
  return (
    <TripLayout tripId={id}>
      <TripTabs activeTab={tab} />
      <TripContent tab={tab} />
    </TripLayout>
  );
}
```

## 🔧 Custom Hooks

### Data Fetching Hooks

```typescript
// hooks/useTrips.ts
export function useTrips() {
  const { data: trips, isLoading, error } = useGetTripsQuery();
  const [createTrip] = useCreateTripMutation();
  const [updateTrip] = useUpdateTripMutation();
  const [deleteTrip] = useDeleteTripMutation();

  return {
    trips: trips || [],
    isLoading,
    error,
    createTrip,
    updateTrip,
    deleteTrip,
  };
}
```

### UI State Hooks

```typescript
// hooks/useModal.ts
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  
  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  
  return { isOpen, openModal, closeModal };
}
```

## 📱 Responsive Design

### Breakpoint Strategy

```typescript
// Tailwind breakpoints
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
};

// Usage in components
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

### Mobile-First Approach

```css
/* Mobile-first CSS */
.component {
  @apply flex flex-col space-y-4;
}

@screen md {
  .component {
    @apply flex-row space-y-0 space-x-4;
  }
}
```

## ⚡ Performance Optimizations

### Code Splitting

```typescript
// Dynamic imports for code splitting
const TripMap = dynamic(() => import('./TripMap'), {
  loading: () => <MapSkeleton />,
  ssr: false,
});

const AIWizard = dynamic(() => import('./AIWizard'), {
  loading: () => <WizardSkeleton />,
});
```

### Memoization

```typescript
// React.memo for component memoization
export const TripCard = React.memo(({ trip, onEdit, onDelete }: TripCardProps) => {
  return (
    <Card>
      {/* Component content */}
    </Card>
  );
});

// useMemo for expensive calculations
const sortedTrips = useMemo(() => {
  return trips.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}, [trips]);
```

### Image Optimization

```typescript
// Next.js Image component
import Image from 'next/image';

<Image
  src={trip.image_url}
  alt={trip.name}
  width={400}
  height={300}
  className="rounded-lg object-cover"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

## 🧪 Testing Strategy

### Component Testing

```typescript
// __tests__/TripCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TripCard } from '../TripCard';

describe('TripCard', () => {
  const mockTrip = {
    id: '1',
    name: 'Test Trip',
    destination: 'Paris',
  };

  it('renders trip information', () => {
    render(<TripCard trip={mockTrip} onEdit={jest.fn()} onDelete={jest.fn()} />);
    
    expect(screen.getByText('Test Trip')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<TripCard trip={mockTrip} onEdit={onEdit} onDelete={jest.fn()} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockTrip);
  });
});
```

## 🔄 Error Handling

### Error Boundaries

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

### API Error Handling

```typescript
// RTK Query error handling
const { data, error, isLoading } = useGetTripsQuery();

if (error) {
  if ('status' in error) {
    // RTK Query error
    const errMsg = 'error' in error ? error.error : JSON.stringify(error.data);
    return <div>Error: {errMsg}</div>;
  } else {
    // SerializedError
    return <div>Error: {error.message}</div>;
  }
}
```

---

**Related Documentation:**
- [Backend Architecture](./backend-architecture.md)
- [Database Schema](./database-schema.md)
- [Security Implementation](./security.md)

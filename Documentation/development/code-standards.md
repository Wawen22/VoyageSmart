# Code Standards

This document outlines the coding standards and best practices for the VoyageSmart project. Following these standards ensures consistency across the codebase and makes it easier for developers to understand and maintain the code.

## General Guidelines

- Use **TypeScript** for all code
- Follow the **DRY** (Don't Repeat Yourself) principle
- Write **self-documenting code** with clear variable and function names
- Keep functions **small and focused** on a single responsibility
- Use **comments** to explain why, not what (the code should be self-explanatory)
- Write **tests** for all new code

## Naming Conventions

- Use **camelCase** for variables, functions, and methods
- Use **PascalCase** for classes, interfaces, types, and React components
- Use **UPPER_CASE** for constants
- Use **kebab-case** for file names (except for React components, which use PascalCase)

### Examples

```typescript
// Variables and functions
const userName = 'John';
function calculateTotal() { ... }

// Classes and React components
class UserProfile { ... }
function UserAvatar() { ... }

// Constants
const API_URL = 'https://api.example.com';

// File names
// user-profile.ts
// UserAvatar.tsx
```

## TypeScript

- Always define **types** for function parameters and return values
- Use **interfaces** for object shapes
- Use **type** for unions, intersections, and mapped types
- Use **enums** for fixed sets of values
- Avoid using **any** unless absolutely necessary

### Examples

```typescript
// Interface for object shape
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Enum for fixed set of values
enum UserRole {
  Admin = 'admin',
  Editor = 'editor',
  Viewer = 'viewer',
}

// Function with typed parameters and return value
function getUserById(id: string): User | null {
  // Implementation
}

// Type for union
type UserIdentifier = string | number;
```

## React Components

- Use **functional components** with hooks instead of class components
- Use **destructuring** for props
- Define **prop types** using TypeScript interfaces
- Use **React.memo** for performance optimization when appropriate
- Keep components **small and focused** on a single responsibility
- Use **custom hooks** to share logic between components

### Examples

```tsx
// Component with typed props
interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Component implementation
  
  return (
    <div className="user-profile">
      {/* JSX */}
    </div>
  );
};

// Custom hook
function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const userData = await getUserById(userId);
        setUser(userData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUser();
  }, [userId]);
  
  return { user, loading, error };
}
```

## State Management

- Use **Redux Toolkit** for global state management
- Use **React Context** for state that is shared between a few components
- Use **local state** (useState) for component-specific state
- Use **RTK Query** for data fetching and caching

### Examples

```typescript
// Redux slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;

// RTK Query
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const tripApi = createApi({
  reducerPath: 'tripApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getTripById: builder.query<Trip, string>({
      query: (id) => `trips/${id}`,
    }),
    updateTrip: builder.mutation<Trip, Partial<Trip> & Pick<Trip, 'id'>>({
      query: ({ id, ...patch }) => ({
        url: `trips/${id}`,
        method: 'PATCH',
        body: patch,
      }),
    }),
  }),
});

export const { useGetTripByIdQuery, useUpdateTripMutation } = tripApi;
```

## Styling

- Use **Styled Components** for component-specific styling
- Use **Tailwind CSS** for utility classes
- Follow a **mobile-first** approach
- Use **theme variables** for colors, spacing, etc.

### Examples

```tsx
// Styled Components
import styled from 'styled-components';

const Button = styled.button`
  background-color: ${(props) => props.theme.colors.primary};
  color: white;
  padding: ${(props) => props.theme.spacing.md};
  border-radius: ${(props) => props.theme.borderRadius.md};
  
  &:hover {
    background-color: ${(props) => props.theme.colors.primaryDark};
  }
`;

// Tailwind CSS
function Card() {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      {/* Card content */}
    </div>
  );
}
```

## Testing

- Write **unit tests** for utility functions and hooks
- Write **component tests** for React components
- Write **integration tests** for complex interactions
- Use **Jest** as the test runner
- Use **React Testing Library** for testing React components

### Examples

```typescript
// Utility function test
describe('calculateTotalExpenses', () => {
  it('should return 0 for empty expenses array', () => {
    expect(calculateTotalExpenses([])).toBe(0);
  });
  
  it('should correctly sum expenses', () => {
    const expenses = [
      { amount: 100, currency: 'USD' },
      { amount: 200, currency: 'USD' },
    ];
    expect(calculateTotalExpenses(expenses)).toBe(300);
  });
});

// Component test
import { render, screen, fireEvent } from '@testing-library/react';

describe('UserProfile', () => {
  it('should display user name', () => {
    const user = { id: '1', name: 'John Doe', email: 'john@example.com' };
    render(<UserProfile user={user} onUpdate={jest.fn()} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
  
  it('should call onUpdate when save button is clicked', () => {
    const user = { id: '1', name: 'John Doe', email: 'john@example.com' };
    const onUpdate = jest.fn();
    render(<UserProfile user={user} onUpdate={onUpdate} />);
    
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Jane Doe' } });
    fireEvent.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith({ ...user, name: 'Jane Doe' });
  });
});
```

## Git Workflow

- Follow the **Conventional Commits** specification for commit messages
- Create a new branch for each feature or bugfix
- Keep pull requests small and focused
- Write descriptive pull request descriptions
- Request code reviews for all pull requests

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **Type**: feat, fix, docs, style, refactor, test, chore
- **Scope**: Optional, can be anything specifying the scope of the commit
- **Subject**: Short description of the change
- **Body**: Optional, detailed description of the change
- **Footer**: Optional, references to issues, breaking changes, etc.

### Examples

```
feat(auth): add login with Google

Add ability to log in with Google OAuth2.0.

Closes #123
```

```
fix(expenses): correct currency conversion

Fix bug where currency conversion was using incorrect exchange rates.

Fixes #456
```

---

Next: [Testing](./testing.md)

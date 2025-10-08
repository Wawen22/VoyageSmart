# System Architecture: Voyage-Smart

## High-Level Overview
Voyage-Smart is a modern, full-stack web application built on **Next.js 15**, leveraging its App Router for a hybrid rendering model of Server and Client Components. It follows a feature-driven, monolithic architecture where the frontend and backend logic are colocated within the same Next.js project, promoting code reusability and streamlined development.

**Core architectural principles:**
- **Separation of Concerns:** Logic is organized into distinct layers: UI components, state management, business logic/services, and API routes.
- **Modularity:** Features are organized into self-contained modules (e.g., trips, expenses, AI chat), making the codebase easier to navigate and maintain.
- **Server-Centric Logic:** Whenever possible, data fetching and mutations are handled on the server via API routes or Server Actions to keep the client-side lean.

## Source Code Structure

### Key Directories
-   `src/app/`: The heart of the application, containing all pages and API routes, organized by feature.
    -   `src/app/(dashboard)/`: Main application pages accessible after login.
    -   `src/app/api/`: All backend API endpoints, grouped by functionality (e.g., `trips`, `stripe`, `ai`).
-   `src/components/`: Contains all reusable React components, organized by feature (e.g., `trips`, `expenses`) and UI primitives (`ui`).
-   `src/lib/`: A critical directory for shared business logic, utilities, and configuration.
    -   `src/lib/features/`: Redux Toolkit slices for managing client-side state.
    -   `src/lib/services/`: Encapsulates logic for interacting with external APIs (e.g., Gemini, Weather) and internal services.
    -   `src/lib/supabase.ts`: Central point for interacting with the Supabase client.
    -   `src/lib/stripe.ts`: Logic for handling Stripe payments and subscriptions.
-   `src/hooks/`: Custom React hooks for shared client-side logic.
-   `supabase/`: Contains database-related files, likely including migrations and RLS policies.

## Data Flow & State Management
-   **Client-Side State:** Managed by **Redux Toolkit**. Slices are defined for features like trips, authentication, and itinerary, providing a predictable state container for the UI.
-   **Server-Side State:** The primary source of truth is the **Supabase PostgreSQL** database. Data is fetched and mutated through API routes in `src/app/api/`.
-   **Authentication:** Handled via **Supabase Auth**. The `src/middleware.ts` file intercepts requests to enforce authentication rules, redirecting users based on their session status.

## Key Design Patterns
-   **Component-Based UI:** The frontend is built using a component-driven approach, with a library of reusable components in `src/components/`.
-   **Provider Pattern:** The application uses several providers (e.g., `AuthProvider`, `ReduxProvider`, `SubscriptionProvider`) to make global state and services available throughout the component tree.
-   **Service Layer:** Business logic for interacting with external APIs and complex internal operations is abstracted into a service layer in `src/lib/services/`. This separates concerns and makes the code more testable.
-   **Fat-API / Thin-Client:** Most of the heavy lifting (data fetching, mutations, business logic) is handled by the Next.js backend, keeping the client-side focused on rendering and user interaction.
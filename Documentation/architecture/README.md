# VoyageSmart Architecture

This section provides a comprehensive overview of VoyageSmart's architecture, including the database schema, frontend and backend architecture, and security considerations.

## 📋 Contents

- [Database Schema](./database-schema.md) - Detailed information about the database structure
- [Frontend Architecture](./frontend-architecture.md) - Overview of the frontend architecture
- [Backend Architecture](./backend-architecture.md) - Overview of the backend architecture
- [Security](./security.md) - Security considerations and implementations

## 🏗️ Architecture Overview

VoyageSmart follows a modern architecture pattern with a clear separation of concerns:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│  Next.js API    │────▶│  Supabase       │
│  (Next.js)      │◀────│  Routes         │◀────│  (PostgreSQL)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │                                               │
        ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│                 │                           │                 │
│  External APIs  │                           │  Supabase       │
│  (Mapbox,       │                           │  Storage        │
│   Gemini AI)    │                           │                 │
│                 │                           │                 │
└─────────────────┘                           └─────────────────┘
```

### Key Components

#### Frontend

- **React with Next.js**: The frontend is built using React with Next.js for server-side rendering and routing
- **Redux Toolkit**: For state management
- **RTK Query**: For data fetching and caching
- **Styled Components**: For styling
- **Mapbox**: For map visualizations

#### Backend

- **Next.js API Routes**: Serverless functions for API endpoints
- **Supabase**: For database, authentication, storage, and realtime functionality
- **Stripe**: For payment processing and subscription management

#### Database

- **PostgreSQL**: The primary database, hosted on Supabase
- **Row-Level Security (RLS)**: For fine-grained access control
- **Realtime**: For real-time updates and collaboration

## 🔄 Data Flow

1. **User Interaction**: User interacts with the React frontend
2. **API Request**: Frontend makes a request to the Next.js API routes
3. **Database Operation**: API routes interact with Supabase
4. **Response**: Data is returned to the frontend
5. **State Update**: Redux store is updated with the new data
6. **UI Update**: React components re-render with the updated data

## 🔌 Integrations

VoyageSmart integrates with several external services:

- **Supabase**: For database, authentication, and storage
- **Mapbox**: For maps and location services
- **Gemini AI**: For AI-powered features
- **Stripe**: For payment processing and subscription management

## 📚 Next Steps

To dive deeper into VoyageSmart's architecture, check out the following pages:

- [Database Schema](./database-schema.md)
- [Frontend Architecture](./frontend-architecture.md)
- [Backend Architecture](./backend-architecture.md)
- [Security](./security.md)

---

Next: [Database Schema](./database-schema.md)

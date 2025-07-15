# VoyageSmart Architecture

<div align="center">
  <h3>🏗️ System Architecture</h3>
  <p>Comprehensive overview of VoyageSmart's modern, scalable architecture.</p>
</div>

---

## 📐 Architecture Components

| Component | Description | Status |
|-----------|-------------|---------|
| **[🗄️ Database Schema](./database-schema.md)** | Complete database structure and relationships | ✅ Available |
| **[🎨 Frontend Architecture](./frontend-architecture.md)** | Frontend system design and patterns | ✅ Available |
| **[⚙️ Backend Architecture](./backend-architecture.md)** | Backend services and API architecture | ✅ Available |
| **[🔒 Security](./security.md)** | Security implementations and best practices | ✅ Available |

---

## 🏗️ Architecture Overview

VoyageSmart follows a modern, scalable architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        VoyageSmart Architecture                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Frontend      │    │   API Layer     │    │   Backend       │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
│  - React 18     │    │  - API Routes   │    │  - PostgreSQL   │
│  - TypeScript   │    │  - Middleware   │    │  - Auth         │
│  - Tailwind CSS │    │  - Validation   │    │  - Storage      │
│  - Redux Toolkit│    │  - Error Handle │    │  - Realtime     │
│  - RTK Query    │    │  - Rate Limiting│    │  - RLS Policies │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  External APIs  │    │  State Mgmt     │    │  File Storage   │
│                 │    │                 │    │                 │
│  - Mapbox GL    │    │  - Redux Store  │    │  - Supabase     │
│  - Gemini AI    │    │  - Local State  │    │    Storage      │
│  - Stripe       │    │  - Session      │    │  - CDN          │
│  - Resend       │    │  - Cache        │    │  - Buckets      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔧 Key Components

#### Frontend Layer

**Technology Stack:**
- **React 18**: Modern React with concurrent features
- **Next.js 15**: Full-stack React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Redux Toolkit**: Predictable state management
- **RTK Query**: Data fetching and caching
- **Framer Motion**: Smooth animations and transitions

**Key Features:**
- Server-side rendering (SSR) and static generation (SSG)
- Client-side routing with Next.js App Router
- Responsive design with mobile-first approach
- Dark/light theme support
- Progressive Web App (PWA) capabilities

#### API Layer

**Next.js API Routes:**
- RESTful API endpoints
- Middleware for authentication and validation
- Error handling and logging
- Rate limiting and security
- Integration with external services

**Key Endpoints:**
- `/api/auth/*` - Authentication flows
- `/api/trips/*` - Trip management
- `/api/activities/*` - Itinerary management
- `/api/expenses/*` - Expense tracking
- `/api/ai/*` - AI-powered features

#### Backend Layer

**Supabase Services:**
- **PostgreSQL Database**: Primary data storage
- **Authentication**: User management and security
- **Storage**: File and media management
- **Realtime**: Live updates and collaboration
- **Edge Functions**: Serverless compute (when needed)

**Database Features:**
- Row-Level Security (RLS) policies
- Real-time subscriptions
- Full-text search capabilities
- JSON/JSONB support for flexible data
- Automated backups and point-in-time recovery

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

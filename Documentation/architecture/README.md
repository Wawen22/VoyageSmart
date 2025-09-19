# VoyageSmart Architecture

## Overview

VoyageSmart is a modern, full-stack travel planning application built with a robust architecture that emphasizes scalability, security, and user experience. The application follows a microservices-inspired approach with clear separation of concerns.

## Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **UI Components**: Custom components with Radix UI primitives
- **Maps**: Mapbox GL JS
- **Authentication**: Supabase Auth

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth with Row Level Security
- **File Storage**: Supabase Storage
- **Email**: Resend API

### External Services
- **AI**: Google Gemini API, OpenAI, DeepSeek
- **Payments**: Stripe
- **Maps**: Mapbox
- **Deployment**: Vercel

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Next.js API   │    │   Supabase      │
│   (Next.js)     │◄──►│   Routes        │◄──►│   PostgreSQL    │
│                 │    │                 │    │   Auth & RLS    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   External      │    │   AI Services   │    │   File Storage  │
│   Services      │    │   (Gemini/GPT)  │    │   (Supabase)    │
│   (Stripe/Maps) │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Application Layers

#### 1. Presentation Layer
- **Components**: Reusable UI components
- **Pages**: Route-specific page components
- **Layouts**: Shared layout components
- **Hooks**: Custom React hooks for business logic

#### 2. Business Logic Layer
- **Redux Slices**: State management for different features
- **Services**: Business logic and API interactions
- **Utils**: Helper functions and utilities
- **Validation**: Input validation schemas

#### 3. Data Access Layer
- **Supabase Client**: Database interactions
- **API Routes**: Server-side endpoints
- **Middleware**: Authentication and authorization
- **Types**: TypeScript type definitions

#### 4. External Integration Layer
- **AI Providers**: Gemini, OpenAI, DeepSeek integrations
- **Payment Processing**: Stripe integration
- **Email Services**: Resend API integration
- **Maps**: Mapbox integration

## Core Features Architecture

### Trip Management
- **Trips**: Central entity for organizing travel plans
- **Participants**: Multi-user collaboration with role-based permissions
- **Invitations**: Email-based invitation system

### Itinerary System
- **Days**: Date-based organization of activities
- **Activities**: Time-based events with location data
- **AI Generation**: Automated itinerary creation

### Expense Management
- **Expenses**: Multi-currency expense tracking
- **Splitting**: Flexible expense splitting algorithms
- **Settlements**: Automatic debt calculation and settlement

### AI Integration
- **Chat Interface**: Conversational AI assistant
- **Context Service**: Trip-aware AI responses
- **Activity Generation**: AI-powered itinerary creation
- **Analytics**: AI usage tracking and optimization

## Security Architecture

### Authentication & Authorization
- **Supabase Auth**: JWT-based authentication
- **Row Level Security**: Database-level access control
- **Role-based Permissions**: Admin, Editor, Viewer roles
- **Session Management**: Secure session handling

### Data Protection
- **Encryption**: Sensitive data encryption
- **HTTPS**: All communications encrypted
- **CORS**: Cross-origin request protection
- **Rate Limiting**: API abuse prevention

### Privacy
- **GDPR Compliance**: Data protection regulations
- **Data Minimization**: Only necessary data collection
- **User Consent**: Explicit consent for data processing

## Performance Architecture

### Frontend Optimization
- **Code Splitting**: Dynamic imports for better loading
- **Image Optimization**: Next.js Image component
- **Caching**: Browser and CDN caching strategies
- **Lazy Loading**: Component and route lazy loading

### Backend Optimization
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis-like caching for frequent queries
- **API Rate Limiting**: Prevent abuse and ensure stability

### Monitoring & Analytics
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Real-time performance metrics
- **User Analytics**: Usage patterns and insights
- **AI Analytics**: AI service performance tracking

## Deployment Architecture

### Vercel Deployment
- **Edge Functions**: Global distribution
- **Automatic Scaling**: Traffic-based scaling
- **Preview Deployments**: Branch-based previews
- **Environment Management**: Secure environment variables

### Database Hosting
- **Supabase Cloud**: Managed PostgreSQL
- **Automatic Backups**: Daily database backups
- **Global Distribution**: Multi-region availability
- **Real-time Subscriptions**: Live data updates

## Development Architecture

### Code Organization
```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── lib/                 # Business logic and utilities
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── styles/              # Global styles and themes
```

### Development Workflow
- **Git Flow**: Feature branch workflow
- **Code Review**: Pull request reviews
- **Testing**: Unit and integration tests
- **CI/CD**: Automated deployment pipeline

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: No server-side state
- **Database Scaling**: Read replicas and sharding
- **CDN Distribution**: Global content delivery
- **Microservices**: Service decomposition ready

### Vertical Scaling
- **Resource Optimization**: Efficient resource usage
- **Caching Strategies**: Multi-level caching
- **Database Optimization**: Query and index optimization
- **Code Optimization**: Performance-focused development

## Future Architecture Plans

### Planned Enhancements
- **Microservices Migration**: Service decomposition
- **Event-Driven Architecture**: Asynchronous processing
- **Advanced Caching**: Redis integration
- **Mobile App**: React Native application
- **Offline Support**: Progressive Web App features

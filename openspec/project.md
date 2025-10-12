# Project Context

## Purpose
VoyageSmart is a full-stack travel planning platform. It helps individuals and groups design itineraries, collaborate on trip details, track expenses, and leverage AI-generated suggestions. The goal is to combine traditional trip management with intelligent assistance so users can plan smarter, stay organized, and manage logistics end to end.

## Tech Stack
- Next.js 15 (App Router) with React 18 for the web app
- TypeScript across the entire codebase
- Tailwind CSS for styling with Radix UI and custom design system components
- Redux Toolkit for client-side state and caching
- Supabase (PostgreSQL, Auth, Storage, RLS policies) as the backend
- Stripe for subscription and payment flows
- Playwright & Jest/React Testing Library for automated testing
- Mapbox GL, Google Gemini, OpenAI, DeepSeek (via OpenRouter), Resend, Weather APIs for specialized features

## Project Conventions

### Code Style
- Strict TypeScript; avoid `any` except in edge cases
- ESLint extends `next/core-web-vitals` and `prettier`; several stylistic rules (e.g., `no-console`, exhaustive deps) are intentionally relaxed for flexibility
- Prettier config: semicolons on, single quotes, trailing commas `es5`, tab width 2, print width 100
- Functional React components with hooks; prefer descriptive filenames and PascalCase component names
- Tailwind utility-first styling with responsive/mobile-first patterns

### Architecture Patterns
- Next.js App Router with a mix of server and client components; route handlers under `src/app/api`
- Supabase provides database, auth, and RLS; helpers wrap Supabase clients for browser, server, and service contexts
- Redux Toolkit slices handle complex client state (subscriptions, transportation, itinerary, etc.) with caching helpers
- Feature- and domain-driven folder structure under `src/` (app, components, lib, features, types, etc.)
- Shared utilities in `src/lib/` (auth, subscription, logging, session manager, config)
- Edge providers such as Stripe and AI services are abstracted behind lib modules for easier swapping/configuration

### Testing Strategy
- Unit/integration tests with Jest (`jest.config.js`) and React Testing Library; coverage collection targets `src/**` with basic thresholds
- E2E/UI tests via Playwright (`e2e/`) targeting multiple browsers and mobile profiles; CI retries failing specs; local baseURL defaults to `http://localhost:3000`
- Jest setup initializes Supabase env vars for isolation (`jest.setup.js`)
- CI goal is to run unit + e2e suites before deploy; developers use `npm run test`, `npm run test:e2e`, or `npm run test:all`

### Git Workflow
- `main`: production-ready branch
- `app-optimization`: integration branch for ongoing feature work
- Feature branches: `feature/<short-description>`; hotfixes: `hotfix/<issue>`
- Conventional Commits format (`type(scope): summary`) for commit messages
- Pull requests originate from feature branches into `app-optimization`; merge to `main` for release/deploy

## Domain Context
- Trips consist of itineraries, accommodations, transportation, collaborative notes, and AI-generated planning aids
- Subscription tiers (`free`, `premium`, `ai`) gate advanced features and content; Supabase tables track subscription history and limits
- AI assistants suggest activities, generate content, and integrate with providers like Gemini and OpenAI
- Users collaborate in real time with shared trip data, expense tracking, and communication flows

## Important Constraints
- Environment variables must be configured for Supabase (URL, anon/service keys), Stripe, AI providers, Mapbox, Resend, Weather API, etc.
- Supabase Row Level Security policies enforce per-user access; service-role actions restricted to server-side only
- GDPR/data privacy considerations documented; avoid logging sensitive PII and follow security checklists
- Payments must comply with Stripe best practices; testing uses Stripe test cards
- App targets PWA responsiveness and performance; monitors Core Web Vitals and bundle size (supports `ANALYZE=true`)

## External Dependencies
- Supabase (database, auth, storage, RLS)
- Stripe (subscription billing, webhooks)
- Google Gemini API, OpenAI API, DeepSeek via OpenRouter (AI features)
- Mapbox GL (interactive maps), Weather API (forecast data)
- Resend (transactional email)
- Vercel deployment platform and telemetry (Next.js)

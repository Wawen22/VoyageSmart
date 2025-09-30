<div align="center">

# 🌍 VoyageSmart

### Intelligent Travel Planning Platform

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/Wawen22/VoyageSmart)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://voyage-smart.app)

**Plan smarter. Travel better. Experience more.**

A modern, full-stack travel planning application that combines traditional organization features with cutting-edge AI assistance to create, manage, and optimize your travel experiences.

[🚀 Live Demo](https://voyage-smart.app) • [📖 Documentation](./Documentation) • [🐛 Report Bug](https://github.com/Wawen22/VoyageSmart/issues) • [✨ Request Feature](https://github.com/Wawen22/VoyageSmart/issues)

</div>

---

## � Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#️-tech-stack)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🎯 Overview

**VoyageSmart** is a comprehensive travel planning platform built with Next.js 15 and Supabase, designed to revolutionize how you plan and manage your trips. Whether you're organizing a solo adventure or coordinating a group vacation, VoyageSmart provides all the tools you need in one intuitive platform.

### Why VoyageSmart?

- 🎯 **All-in-One Solution** - Trip planning, expense tracking, and collaboration in a single platform
- 🤖 **AI-Powered Intelligence** - Let AI handle the heavy lifting with smart itinerary generation
- 👥 **Built for Teams** - Real-time collaboration features for group travel
- 💰 **Financial Clarity** - Never argue about expenses again with smart splitting
- 🌐 **Always Accessible** - Progressive Web App (PWA) works offline and on any device

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🤖 AI-Powered Planning
- Intelligent itinerary generation
- Smart travel suggestions
- Automated activity recommendations
- Multi-provider AI support (Gemini, OpenAI, DeepSeek)

### 👥 Collaborative Planning
- Real-time collaboration
- Invite friends and family
- Shared trip management
- Activity voting and comments

</td>
<td width="50%">

### 💰 Smart Expense Management
- Track all trip expenses
- Split costs automatically
- Multiple currency support
- Expense categories and tags

### 🗺️ Interactive Maps
- Mapbox integration
- Location visualization
- Route planning
- Points of interest

</td>
</tr>
<tr>
<td width="50%">

### 📅 Itinerary Planning
- Day-by-day activity planning
- Calendar integration
- Time management
- Activity templates

### 🏨 Accommodation & Transport
- Hotel reservation management
- Flight tracking
- Train and local transport
- Booking confirmations

</td>
<td width="50%">

### 📱 Responsive Design
- Mobile-first approach
- Progressive Web App (PWA)
- Offline capabilities
- Cross-platform support

### 🔒 Security & Privacy
- Enterprise-grade security
- Supabase authentication
- Row-level security (RLS)
- Data encryption

</td>
</tr>
</table>
---

## 🛠️ Tech Stack

<table>
<tr>
<td width="33%">

**Frontend**
- ⚡ Next.js 15 (App Router)
- 📘 TypeScript 5.4
- 🎨 Tailwind CSS
- 🔄 Redux Toolkit
- 🧩 Radix UI
- 🗺️ Mapbox GL JS

</td>
<td width="33%">

**Backend**
- 🗄️ Supabase (PostgreSQL)
- 🔐 Supabase Auth
- 🚀 Next.js API Routes
- 💳 Stripe Payments
- 📧 Resend (Email)
- 🔄 Real-time subscriptions

</td>
<td width="33%">

**AI & Tools**
- 🤖 Google Gemini API
- 🧠 OpenAI
- 🔮 DeepSeek
- 🧪 Jest & Playwright
- 📦 Vercel (Deployment)
- 📊 Bundle Analyzer

</td>
</tr>
</table>

---

## 🚀 Quick Start

> **Get up and running in less than 5 minutes!**

### Prerequisites

Before you begin, ensure you have the following installed and configured:

| Requirement | Version | Purpose |
|------------|---------|---------|
| 📦 Node.js | 18.0+ | Runtime environment |
| 📦 npm/yarn | 8.0+ | Package manager |
| 🗄️ Supabase | - | Database & Auth |
| 💳 Stripe | - | Payment processing |
| 🗺️ Mapbox | - | Maps integration |
| 🤖 Google AI | - | AI features |

### ⚡ Installation

```bash
# 1. Clone the repository
git clone https://github.com/Wawen22/VoyageSmart.git
cd VoyageSmart

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local

# 4. Configure your .env.local file with your API keys
# (See Configuration section below)

# 5. Start the development server
npm run dev

# 6. Open your browser
# Navigate to http://localhost:3002
```

<details>
<summary>📋 <strong>Environment Variables Configuration</strong></summary>

Create a `.env.local` file in the root directory with the following variables:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3002

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_test_your_secret
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_your_premium_id
NEXT_PUBLIC_STRIPE_AI_PRICE_ID=price_your_ai_id

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Email (Optional)
RESEND_API_KEY=your_resend_api_key
```

</details>

---

## 📖 Usage

### Getting Started with VoyageSmart

<table>
<tr>
<td width="5%">1️⃣</td>
<td><strong>Sign Up / Sign In</strong><br/>Create a new account or sign in to your existing account</td>
</tr>
<tr>
<td>2️⃣</td>
<td><strong>Create a Trip</strong><br/>Click the "New Trip" button and add destination, dates, and participants</td>
</tr>
<tr>
<td>3️⃣</td>
<td><strong>Plan Your Itinerary</strong><br/>Add activities manually or use AI assistance for smart suggestions</td>
</tr>
<tr>
<td>4️⃣</td>
<td><strong>Manage Expenses</strong><br/>Track costs and split them automatically among participants</td>
</tr>
<tr>
<td>5️⃣</td>
<td><strong>Collaborate</strong><br/>Invite friends and family to join and plan together in real-time</td>
</tr>
<tr>
<td>6️⃣</td>
<td><strong>Enjoy Your Trip!</strong><br/>Access your itinerary offline and make updates on the go</td>
</tr>
</table>

### 🎥 Demo & Screenshots

> 📸 *Screenshots and demo videos coming soon!*

---

## 💻 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3002 |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests with Jest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests with Playwright |
| `npm run type-check` | Run TypeScript type checking |
| `npm run analyze` | Analyze bundle size |

### Development Workflow

```bash
# Start development server
npm run dev

# Run tests in watch mode (in another terminal)
npm run test:watch

# Type check your code
npm run type-check

# Lint your code
npm run lint
```

---

## 🧪 Testing

VoyageSmart uses a comprehensive testing strategy to ensure code quality and reliability.

### Unit Testing (Jest)

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### End-to-End Testing (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed
```

### 💳 Stripe Payment Testing

VoyageSmart uses two separate Stripe environments to ensure security and testing flexibility:

<details>
<summary>🔴 <strong>Production Environment (Live)</strong></summary>

- **Environment**: `main` branch → https://voyage-smart.app
- **Stripe**: Live mode with `pk_live_` and `sk_live_` keys
- **Payments**: Real cards with actual charges
- **Usage**: Real customers in production

</details>

<details>
<summary>🧪 <strong>Testing Environment (Sandbox)</strong></summary>

- **Environment**: Local development and `app-optimization` branch
- **Stripe**: Test mode with `pk_test_` and `sk_test_` keys
- **Payments**: Test cards without real charges
- **Usage**: Development and testing

</details>

### Test Card Numbers

Use these test cards to simulate different payment scenarios:

| Card Number | Scenario | Description |
|-------------|----------|-------------|
| `4242 4242 4242 4242` | ✅ Success | Payment succeeds |
| `4000 0000 0000 0002` | ❌ Declined | Card is declined |
| `4000 0025 0000 3155` | ⚠️ 3D Secure | Requires authentication |

**Additional Details for Testing:**
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any valid postal code

### Setting Up Test Environment

```bash
# 1. Create test environment file
cp .env.local.example .env.test

# 2. Configure with Stripe test keys
# Edit .env.test with your pk_test_ and sk_test_ keys

# 3. Use test environment
cp .env.test .env.local

# 4. Start development server
npm run dev
```

### Complete Testing Workflow

<details>
<summary><strong>1. Local Setup (Sandbox)</strong></summary>

#### Configure Local Environment

```bash
# Copy test template
cp .env.test .env.local

# Add local URL for testing
echo "NEXT_PUBLIC_APP_URL=http://localhost:3002" >> .env.local
```

#### Configure Supabase for Local Testing

1. Go to **Supabase Dashboard** → Your Project → **Authentication** → **URL Configuration**
2. **Add** (don't replace) these Redirect URLs:
   - `http://localhost:3002/auth/callback`
   - `http://localhost:3002/confirm-email`
   - `http://localhost:3002/login`
3. **Keep** Site URL as `https://www.voyage-smart.app`

#### Start and Test

```bash
# Start development server
npm run dev

# Open browser at http://localhost:3002
```

</details>

<details>
<summary><strong>2. Authentication Testing</strong></summary>

**Registration Flow:**
1. Navigate to http://localhost:3002
2. Click "Sign Up" and create a new account
3. Check confirmation email
4. Click link in email → should redirect to localhost:3002
5. Verify automatic login

**Login/Logout:**
1. Log out from the application
2. Test login with credentials
3. Test "Forgot Password" flow

</details>

<details>
<summary><strong>3. Payment Testing (Stripe Sandbox)</strong></summary>

1. Access the subscriptions section
2. Select Premium or AI plan
3. Use test cards:
   - ✅ **Success**: `4242 4242 4242 4242`
   - ❌ **Declined**: `4000 0000 0000 0002`
   - ⚠️ **3D Secure**: `4000 0025 0000 3155`
4. Verify complete flow: Checkout → Payment → Redirect → Plan Activation

</details>

<details>
<summary><strong>4. Feature Testing</strong></summary>

1. Create a new trip
2. Add activities
3. Test AI Assistant (if you have AI plan)
4. Manage expenses
5. Invite participants

</details>

### ⚠️ Important Testing Notes

> **🚨 Critical Rules:**
> - **NEVER** test real payments in development environment
> - **ALWAYS** use Stripe Test mode for development
> - **Stripe Live** only for real customers in production
> - Separate webhooks for test and production
> - Supabase Redirect URLs must include both localhost and production
> - **ALWAYS** test complete flow before production deployment

### 🚨 Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] ✅ Complete authentication testing (registration, login, email)
- [ ] ✅ Stripe payment testing with test cards
- [ ] ✅ Main app features tested
- [ ] ✅ Preview/staging environment tested
- [ ] ✅ Environment variables configured on Vercel
- [ ] ✅ Supabase URL Configuration updated
- [ ] ✅ Stripe webhooks configured for production
- [ ] ✅ No errors in development logs
- [ ] ✅ TypeScript type checking passed
- [ ] ✅ All tests passing (unit + E2E)

---

## 🚀 Deployment

VoyageSmart uses a Git-based workflow for automatic deployment on Vercel with two main environments.

### 📋 Branch Strategy

| Branch | Environment | URL | Purpose |
|--------|-------------|-----|---------|
| `main` | 🔴 Production | https://voyage-smart.app | Live application |
| `app-optimization` | 🟡 Preview/Staging | Auto-generated | Testing & QA |

### 🔄 Deployment Workflow

<details>
<summary><strong>1. Local Development</strong></summary>

```bash
# Start development server
npm run dev

# App available at http://localhost:3002
```

</details>

<details>
<summary><strong>2. Preview Deployment (Staging)</strong></summary>

```bash
# Commit your changes
git add .
git commit -m "feat: description of changes"

# Push to app-optimization for preview deployment
git push origin app-optimization

# Or use the npm script
npm run deploy:preview
```

✅ **Result**: Automatic deployment to Preview environment for testing

</details>

<details>
<summary><strong>3. Production Deployment</strong></summary>

```bash
# Switch to main branch
git checkout main

# Merge changes from app-optimization
git merge app-optimization

# Push to main for production deployment
git push origin main

# Or use the npm script
npm run deploy:prod
```

✅ **Result**: Automatic deployment to Production environment

</details>

### 🔧 Vercel CLI (Optional)

```bash
# Manual preview deployment
vercel

# Manual production deployment
vercel --prod

# List all deployments
vercel ls

# View deployment logs
vercel logs [deployment-url]
```

### 📊 Monitoring & Logs

- 📈 **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- 📝 **Production Logs**: Available via Vercel dashboard
- 🔍 **Preview Logs**: Available for each preview deployment
- 🚨 **Error Tracking**: Real-time error monitoring

### ⚠️ Deployment Best Practices

> **Important Guidelines:**
> - ✅ **Always test on Preview** before merging to main
> - ✅ **Environment variables** are configured separately for each environment
> - ✅ **Deployments are automatic** on every push to configured branches
> - ✅ **Rollback available** via Vercel dashboard if issues occur
> - ✅ **Run all tests** before deploying to production
> - ✅ **Check build logs** for warnings or errors

---

## 📁 Project Structure

```
VoyageSmart/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── api/               # API route handlers
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── trips/             # Trip management pages
│   │   ├── documentation/     # Documentation pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Layout components
│   │   └── [feature]/        # Feature-specific components
│   ├── lib/                  # Business logic & utilities
│   │   ├── features/         # Redux slices
│   │   ├── services/         # API services
│   │   ├── utils/            # Utility functions
│   │   └── config.ts         # App configuration
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript type definitions
│   └── styles/               # Global styles & themes
├── public/                   # Static assets
│   ├── images/              # Images & icons
│   └── manifest.json        # PWA manifest
├── Documentation/            # Project documentation
│   ├── architecture/        # Architecture docs
│   ├── development/         # Development guides
│   ├── getting-started/     # Getting started guides
│   └── technical/           # Technical documentation
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   └── e2e/                # End-to-end tests
├── .env.local.example      # Environment variables template
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

---

## 🤝 Contributing

We welcome contributions to VoyageSmart! Please read our [Contributing Guide](./Documentation/development/contributing.md) for details on our code of conduct and the process for submitting pull requests.

### Development Process

1. 🍴 Fork the repository
2. 🌿 Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. ✅ Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. 📤 Push to the branch (`git push origin feature/AmazingFeature`)
5. 🔀 Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

---

## 📄 License

This project is **private and proprietary**. All rights reserved.

© 2024 VoyageSmart Team. Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

## 💬 Support

Need help? We're here for you!

- 📧 **Email**: support@voyage-smart.app
- 📖 **Documentation**: [./Documentation](./Documentation)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Wawen22/VoyageSmart/issues)
- 💡 **Feature Requests**: [GitHub Issues](https://github.com/Wawen22/VoyageSmart/issues)

---

## 🙏 Acknowledgments

VoyageSmart is built with amazing open-source technologies:

- [Next.js](https://nextjs.org/) - The React Framework for Production
- [Supabase](https://supabase.com/) - Open Source Firebase Alternative
- [Stripe](https://stripe.com/) - Payment Processing Platform
- [Mapbox](https://www.mapbox.com/) - Maps & Location Services
- [Tailwind CSS](https://tailwindcss.com/) - Utility-First CSS Framework
- [Vercel](https://vercel.com/) - Deployment & Hosting Platform

---

<div align="center">

### Made with ❤️ by the VoyageSmart Team

**[⬆ Back to Top](#-voyagesmart)**

</div>

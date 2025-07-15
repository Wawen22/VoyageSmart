# VoyageSmart

<div align="center">
  <h3>🌍 Intelligent Travel Planning Platform</h3>
  <p>A comprehensive travel planning application that combines traditional organization features with advanced AI assistance to create, manage, and optimize your travel experiences.</p>
  
  <p>
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#documentation">Documentation</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>

---

## 🚀 Overview

VoyageSmart is a modern, full-stack travel planning platform designed to simplify trip organization, expense management, and collaboration among travelers. Built with Next.js and powered by Supabase, it offers both manual planning tools and AI-powered assistance to create the perfect travel experience.

### Key Highlights

- 🤖 **AI-Powered Planning** - Intelligent itinerary generation and travel suggestions
- 👥 **Collaborative Planning** - Real-time collaboration with fellow travelers
- 💰 **Smart Expense Management** - Track, split, and manage travel expenses
- 🗺️ **Interactive Maps** - Mapbox integration for location visualization
- 📱 **Responsive Design** - Seamless experience across all devices
- 🔒 **Secure & Private** - Enterprise-grade security with Supabase

## ✨ Features

### Core Features
- **Trip Management** - Create, organize, and manage multiple trips
- **Itinerary Planning** - Day-by-day activity planning with calendar integration
- **Accommodation Booking** - Manage hotel reservations and lodging details
- **Transportation** - Track flights, trains, and local transport
- **Expense Tracking** - Comprehensive expense management with splitting capabilities
- **Collaboration** - Invite friends and family to plan together

### AI-Enhanced Features
- **Smart Itinerary Generation** - AI-powered activity suggestions based on preferences
- **Intelligent Expense Analysis** - Automated expense categorization and insights
- **Travel Recommendations** - Personalized suggestions for activities and destinations
- **Budget Optimization** - AI-driven budget planning and cost-saving tips

### Premium Features
- **Advanced AI Assistant** - Enhanced AI capabilities with subscription
- **Priority Support** - Dedicated customer support
- **Extended Storage** - Increased storage for photos and documents
- **Advanced Analytics** - Detailed travel insights and reports

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Styled Components
- **UI Components**: Radix UI + Custom Components
- **State Management**: Redux Toolkit
- **Maps**: Mapbox GL JS
- **Icons**: Heroicons + Lucide React

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **API**: Next.js API Routes

### AI & Integrations
- **AI Provider**: Google Gemini API
- **Payments**: Stripe
- **Email**: React Email + Resend
- **Maps**: Mapbox

### Development & Deployment
- **Testing**: Jest + Playwright
- **Linting**: ESLint + Prettier
- **Deployment**: Vercel
- **Version Control**: Git + GitHub

## 🚀 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payments)
- Mapbox account (for maps)
- Google AI account (for Gemini API)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Wawen22/VoyageSmart.git
   cd VoyageSmart
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   
   # Google AI
   GEMINI_API_KEY=your_gemini_api_key
   
   # Mapbox
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
   ```

4. **Set up the database**
   ```bash
   # Run Supabase migrations (if using local development)
   npx supabase db reset
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Creating Your First Trip

1. **Sign up** for a new account or **sign in** to your existing account
2. **Create a new trip** by clicking the "New Trip" button
3. **Add trip details** including destination, dates, and participants
4. **Start planning** your itinerary with manual entry or AI assistance
5. **Manage expenses** by adding costs and splitting them among participants
6. **Collaborate** by inviting friends and family to join your trip

### Using AI Features

1. **Subscribe** to the AI Assistant plan for enhanced features
2. **Use the AI Wizard** to generate automatic itineraries
3. **Ask the AI Assistant** for travel recommendations and tips
4. **Get expense insights** with AI-powered analysis

## 🧪 Testing

Run the test suite:

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage

# All tests
npm run test:all
```

## 📚 Documentation

Comprehensive documentation is available in the `/documentation` section of the application:

- **[Getting Started](./Documentation/getting-started/)** - Installation and setup guides
- **[Features](./Documentation/features/)** - Detailed feature documentation
- **[API Reference](./Documentation/api/)** - API endpoints and usage
- **[Development](./Documentation/development/)** - Development guidelines and standards
- **[Integrations](./Documentation/integrations/)** - Third-party service integrations

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./Documentation/development/contributing.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass (`npm run test:all`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

- **Documentation**: Check our comprehensive [documentation](./Documentation/)
- **Issues**: Report bugs and request features via [GitHub Issues](https://github.com/Wawen22/VoyageSmart/issues)
- **Email**: Contact us at support@voyagesmart.com

---

<div align="center">
  <p>Made with ❤️ by the VoyageSmart Team</p>
</div>

# VoyageSmart

🌍 **Intelligent Travel Planning Platform**

A modern travel planning application that combines traditional organization features with AI assistance to create, manage, and optimize your travel experiences.

## 🚀 Overview

VoyageSmart is a full-stack travel planning platform built with Next.js and Supabase. It offers trip organization, expense management, and collaborative planning tools with AI-powered assistance.

### Key Features

- 🤖 **AI-Powered Planning** - Intelligent itinerary generation and travel suggestions
- 👥 **Collaborative Planning** - Real-time collaboration with fellow travelers
- 💰 **Smart Expense Management** - Track, split, and manage travel expenses
- 🗺️ **Interactive Maps** - Mapbox integration for location visualization
- 📱 **Responsive Design** - Seamless experience across all devices
- 🔒 **Secure & Private** - Enterprise-grade security with Supabase

## ✨ Core Features

- **Trip Management** - Create, organize, and manage multiple trips
- **Itinerary Planning** - Day-by-day activity planning with calendar integration
- **Accommodation Booking** - Manage hotel reservations and lodging details
- **Transportation** - Track flights, trains, and local transport
- **Expense Tracking** - Comprehensive expense management with splitting capabilities
- **Collaboration** - Invite friends and family to plan together
- **AI Assistant** - Intelligent travel suggestions and automated planning
- **Interactive Maps** - Mapbox integration for location visualization
## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Redux Toolkit
- **Backend**: Supabase (PostgreSQL), Next.js API Routes
- **AI**: Google Gemini API, OpenAI, DeepSeek
- **Payments**: Stripe
- **Maps**: Mapbox GL JS
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)
- Mapbox account (for maps)
- Google AI account (for Gemini API)

### Installation

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

   Configure your environment variables for Supabase, Stripe, Google AI, and Mapbox.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Basic Usage

1. **Sign up** for a new account or **sign in** to your existing account
2. **Create a new trip** by clicking the "New Trip" button
3. **Add trip details** including destination, dates, and participants
4. **Start planning** your itinerary with manual entry or AI assistance
5. **Manage expenses** by adding costs and splitting them among participants
6. **Collaborate** by inviting friends and family to join your trip

## 🧪 Development

```bash
# Run tests
npm run test

# Build for production
npm run build

# Start production server
npm start
```

## � Deployment Workflow

VoyageSmart utilizza un flusso di lavoro Git-based per il deployment automatico su Vercel con due ambienti principali:

### 📋 Branch Strategy

- **`main`** → **Production** (https://voyage-smart.app)
- **`app-optimization`** → **Preview** (ambiente di staging)

### 🔄 Flusso di Lavoro Consigliato

#### 1. **Sviluppo Locale**
```bash
# Avvia il server di sviluppo
npm run dev

# L'app sarà disponibile su http://localhost:3002
```

#### 2. **Testing su Preview (Staging)**
```bash
# Committa le modifiche
git add .
git commit -m "Descrizione delle modifiche"

# Push su app-optimization per il deploy di preview
git push origin app-optimization
```
✅ **Risultato**: Deploy automatico su ambiente Preview per testing

#### 3. **Deploy in Production**
```bash
# Passa al branch main
git checkout main

# Merge delle modifiche da app-optimization
git merge app-optimization

# Push su main per il deploy in produzione
git push origin main
```
✅ **Risultato**: Deploy automatico su ambiente Production

### 🔧 Comandi Vercel CLI (Opzionali)

```bash
# Deploy manuale su preview
vercel

# Deploy manuale su production
vercel --prod

# Visualizza i deployment
vercel ls
```

### 📊 Monitoraggio

- **Dashboard Vercel**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Logs Production**: Accessibili tramite Vercel dashboard
- **Logs Preview**: Disponibili per ogni deployment di preview

### ⚠️ Note Importanti

- **Sempre testare su Preview** prima di fare il merge su main
- **Le variabili d'ambiente** sono configurate separatamente per ogni ambiente
- **I deployment sono automatici** ad ogni push sui branch configurati
- **Rollback disponibile** tramite dashboard Vercel in caso di problemi

## �📄 License

This project is private and proprietary. All rights reserved.

---

<div align="center">
  <p>Made with ❤️ by the VoyageSmart Team</p>
</div>

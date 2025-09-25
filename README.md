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

## 🧪 Development & Testing

### Local Development
```bash
# Run tests
npm run test

# Build for production
npm run build

# Start production server
npm start
```

### 💳 Stripe Payment Testing

VoyageSmart utilizza due ambienti Stripe separati per garantire sicurezza e flessibilità nei test:

#### 🔴 **Production Environment (Live)**
- **Ambiente**: `main` branch → https://voyage-smart.app
- **Stripe**: Live mode con chiavi `pk_live_` e `sk_live_`
- **Pagamenti**: Solo carte reali con addebiti effettivi
- **Uso**: Clienti reali in produzione

#### 🧪 **Testing Environment (Sandbox)**
- **Ambiente**: Sviluppo locale e branch `app-optimization`
- **Stripe**: Test mode con chiavi `pk_test_` e `sk_test_`
- **Pagamenti**: Carte di test senza addebiti reali
- **Uso**: Sviluppo e testing

### 🛠️ Setup Testing Environment

#### 1. **Crea file .env.test**
```bash
# Copia il file di esempio
cp .env.local.example .env.test
```

#### 2. **Configura le chiavi Stripe Test**
```bash
# .env.test - Configurazione per testing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id
NEXT_PUBLIC_STRIPE_AI_PRICE_ID=price_your_ai_price_id
```

#### 3. **Avvia in modalità test**
```bash
# Usa il file di test per lo sviluppo locale
cp .env.test .env.local

# Avvia il server di sviluppo
npm run dev
```

### 🧪 **Carte di Test Stripe**

Usa queste carte per testare diversi scenari:

```bash
# ✅ Pagamento riuscito
4242 4242 4242 4242

# ❌ Carta declinata
4000 0000 0000 0002

# ⚠️ Richiede autenticazione 3D Secure
4000 0025 0000 3155

# 💳 Altri dettagli per i test
Scadenza: Qualsiasi data futura (es. 12/25)
CVC: Qualsiasi 3 cifre (es. 123)
```

### 🔄 **Workflow di Testing Completo**

#### 1. **Setup Test Locale (Sandbox)**

##### **Passo 1: Configura ambiente locale**
```bash
# Copia il template di test
cp .env.test .env.local

# Aggiungi URL locale per testing
echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.local
```

##### **Passo 2: Configura Supabase per test locale**
1. Vai su **Supabase Dashboard** → Il tuo progetto → **Authentication** → **URL Configuration**
2. **Aggiungi** (non sostituire) questi Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/confirm-email`
   - `http://localhost:3000/login`
3. **Mantieni** Site URL su `https://www.voyage-smart.app`

##### **Passo 3: Avvia e testa**
```bash
# Avvia server di sviluppo
npm run dev

# Apri browser su http://localhost:3000
```

#### 2. **Test Completo del Flusso**

##### **Test Autenticazione:**
1. **Registrazione**:
   - Vai su http://localhost:3000
   - Clicca "Sign Up" e registra nuovo account
   - Controlla email di conferma
   - Clicca link nella email → deve reindirizzare a localhost:3000
   - Verifica login automatico

2. **Login/Logout**:
   - Fai logout
   - Prova login con credenziali
   - Testa "Password dimenticata"

##### **Test Pagamenti Stripe (Sandbox):**
1. **Accedi alla sezione abbonamenti**
2. **Seleziona piano Premium o AI**
3. **Usa carte di test**:
   - ✅ **Successo**: `4242 4242 4242 4242`
   - ❌ **Fallimento**: `4000 0000 0000 0002`
   - ⚠️ **3D Secure**: `4000 0025 0000 3155`
   - **Scadenza**: Qualsiasi data futura (es. 12/25)
   - **CVC**: Qualsiasi 3 cifre (es. 123)

4. **Verifica flusso completo**:
   - Checkout → Pagamento → Redirect → Attivazione piano

##### **Test Funzionalità App:**
1. **Crea nuovo viaggio**
2. **Aggiungi attività**
3. **Testa AI Assistant** (se hai piano AI)
4. **Gestisci spese**
5. **Invita partecipanti**

#### 3. **Test Preview (Staging)**
```bash
# Committa modifiche
git add .
git commit -m "feat: nuove funzionalità"

# Push su branch di staging
git push origin app-optimization

# Testa su ambiente preview
# URL: https://preview-url.vercel.app
```

#### 4. **Deploy Production (Live)**
```bash
# Solo dopo aver testato tutto in sandbox e preview
git checkout main
git merge app-optimization
git push origin main

# Deploy automatico su produzione
# URL: https://www.voyage-smart.app
```

#### 5. **Ripristino Ambiente Locale**

Dopo i test, ripristina per produzione:
```bash
# Ripristina URL di produzione
sed -i 's|NEXT_PUBLIC_APP_URL=http://localhost:3000|NEXT_PUBLIC_APP_URL=https://www.voyage-smart.app|' .env.local

# Oppure ricopia il file originale
# (assicurati di avere un backup del .env.local di produzione)
```

### ⚠️ **Note Importanti**

- **MAI testare pagamenti reali** in ambiente di sviluppo
- **Sempre usare Stripe Test** per sviluppo e testing
- **Stripe Live** solo per clienti reali in produzione
- **Webhook separati** per test e produzione
- **Supabase Redirect URLs** devono includere sia localhost che produzione
- **Testare sempre il flusso completo** prima del deploy in produzione

### 🚨 **Checklist Pre-Deploy**

Prima di fare deploy in produzione, verifica:

- [ ] ✅ Test autenticazione completo (registrazione, login, email)
- [ ] ✅ Test pagamenti Stripe con carte di test
- [ ] ✅ Test funzionalità principali dell'app
- [ ] ✅ Test su ambiente preview/staging
- [ ] ✅ Variabili d'ambiente configurate su Vercel
- [ ] ✅ Supabase URL Configuration aggiornata
- [ ] ✅ Webhook Stripe configurati per produzione
- [ ] ✅ Nessun errore nei log di sviluppo

### 🔧 **Script Utili**

Aggiungi questi script al `package.json` per facilitare il testing:

```json
{
  "scripts": {
    "dev:local": "NEXT_PUBLIC_APP_URL=http://localhost:3000 npm run dev",
    "dev:prod": "NEXT_PUBLIC_APP_URL=https://www.voyage-smart.app npm run dev",
    "test:stripe": "echo 'Usa carte di test: 4242 4242 4242 4242'",
    "deploy:preview": "git push origin app-optimization",
    "deploy:prod": "git checkout main && git merge app-optimization && git push origin main"
  }
}
```

## 🚀 Deployment Workflow

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

## 📄 License

This project is private and proprietary. All rights reserved.

---

<div align="center">
  <p>Made with ❤️ by the VoyageSmart Team</p>
</div>

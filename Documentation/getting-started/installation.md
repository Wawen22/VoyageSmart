# Installing VoyageSmart

This comprehensive guide will walk you through the process of installing VoyageSmart on your local machine for development purposes.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Node.js** (v16.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v7.0.0 or higher) - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)

### Verify Installation

Check that everything is installed correctly:

```bash
# Check Node.js version
node --version
# Should output v16.0.0 or higher

# Check npm version
npm --version
# Should output v7.0.0 or higher

# Check Git version
git --version
# Should output git version 2.x.x or higher
```

### Required Service Accounts

You'll need accounts for the following services:

- **[Supabase](https://supabase.com/)** - For database, authentication, and storage (Required)
- **[Mapbox](https://www.mapbox.com/)** - For maps and location services (Required)
- **[Stripe](https://stripe.com/)** - For payment processing (Optional for local development)
- **[Google Cloud Platform](https://cloud.google.com/)** - For Gemini AI API (Optional for local development)

## 🚀 Step 1: Clone the Repository

First, clone the VoyageSmart repository to your local machine:

```bash
# Clone the repository
git clone https://github.com/Wawen22/VoyageSmart.git

# Navigate to the project directory
cd VoyageSmart

# Verify the project structure
ls -la
```

You should see the following project structure:
```
VoyageSmart/
├── Documentation/       # Project documentation
├── public/             # Static assets
├── src/                # Source code
├── supabase/           # Database schema and migrations
├── .env.local.example  # Environment variables template
├── package.json        # Project dependencies
├── README.md           # Project overview
└── ...
```

## 📦 Step 2: Install Dependencies

Install all the necessary dependencies for VoyageSmart:

```bash
# Install dependencies
npm install

# This will install:
# - Next.js 15 (React framework)
# - Supabase client libraries
# - Tailwind CSS (styling)
# - Redux Toolkit (state management)
# - And many other dependencies...
```

**Note**: The installation may take a few minutes depending on your internet connection.

## 🗄️ Step 3: Set Up Supabase Database

VoyageSmart uses Supabase as its backend database. Follow these steps:

### 3.1 Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com/)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `voyage-smart` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
5. Click "Create new project"

### 3.2 Get Project Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Project API Key** (anon/public key)

### 3.3 Set Up Database Schema

Run the database setup to create all necessary tables:

```bash
# Navigate to the supabase directory
cd supabase

# Install Supabase CLI if not already installed
npm install -g supabase

# Initialize Supabase (if not already done)
supabase init

# Link to your project (replace with your project reference)
supabase link --project-ref your-project-ref

# Push the schema to your Supabase project
supabase db push
```

For detailed Supabase setup instructions, see the [Supabase Integration Guide](../integrations/supabase.md).

## ⚙️ Step 4: Configure Environment Variables

Create your environment configuration file:

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Open the file in your preferred editor
nano .env.local  # or code .env.local for VS Code
```

Configure the following variables in `.env.local`:

### Required Variables

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Mapbox Configuration (Required for maps)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-mapbox-token
```

### Optional Variables (for full functionality)

```env
# Gemini AI Configuration (for AI features)
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Stripe Configuration (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Stripe Price IDs (for subscription plans)
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id
NEXT_PUBLIC_STRIPE_AI_PRICE_ID=price_your_ai_price_id

# Email Configuration (for notifications)
RESEND_API_KEY=re_your-resend-api-key

# Cron Job Security (for subscription management)
CRON_API_KEY=your-secure-cron-api-key
```

### How to Get API Keys

- **Supabase**: From your project settings → API
- **Mapbox**: From [mapbox.com](https://account.mapbox.com/access-tokens/)
- **Gemini AI**: From [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Stripe**: From [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- **Resend**: From [Resend Dashboard](https://resend.com/api-keys)

## 🚀 Step 5: Start the Development Server

Now you're ready to start the development server:

```bash
# Start the development server
npm run dev

# The server will start on http://localhost:3000
# You should see output similar to:
# ▲ Next.js 15.x.x
# - Local:        http://localhost:3000
# - Network:      http://192.168.x.x:3000
```

Your application will be available at `http://localhost:3000`.

## 💳 Step 6: Set Up Stripe Webhook (Optional)

If you want to test the subscription functionality locally, you'll need to set up Stripe webhook forwarding:

### 6.1 Install Stripe CLI

```bash
# macOS (using Homebrew)
brew install stripe/stripe-cli/stripe

# Windows (using Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### 6.2 Configure Stripe CLI

```bash
# Log in to your Stripe account
stripe login

# This will open a browser window to authenticate
```

### 6.3 Start Webhook Forwarding

```bash
# Start the webhook forwarding
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# You'll see output like:
# > Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

### 6.4 Update Environment Variables

Add the webhook signing secret to your `.env.local` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_cli_output
```

## Troubleshooting

### Common Issues

#### "Module not found" errors

If you encounter "Module not found" errors, try the following:

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```

#### Supabase connection issues

If you're having trouble connecting to Supabase:

1. Verify your Supabase URL and anon key in `.env.local`
2. Check if your Supabase project is active
3. Ensure your IP is not blocked by Supabase

#### Port already in use

If port 3000 is already in use, you can specify a different port:

```bash
npm run dev -- -p 3001
```

## Next Steps

Now that you have VoyageSmart installed, you can:

- [Configure your application](./configuration.md)
- [Take your first steps with VoyageSmart](./first-steps.md)
- [Explore the features](../features/README.md)

---

Next: [Configuration](./configuration.md)

# Installation Guide

This guide will help you install and set up VoyageSmart on your local development environment.

## System Requirements

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Git**: For version control
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Wawen22/VoyageSmart.git
cd VoyageSmart
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Supabase client
- And many more...

### 3. Environment Setup

Copy the environment template:
```bash
cp .env.example .env.local
```

### 4. Configure Environment Variables

Edit `.env.local` and add your configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Verification

To verify your installation:

1. Open `http://localhost:3000` in your browser
2. You should see the VoyageSmart landing page
3. Try creating an account to test the authentication flow

## Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
npm run dev -- -p 3001
```

**Node version issues:**
Use Node Version Manager (nvm) to switch to Node 18+

**Permission errors:**
On Windows, run terminal as administrator
On macOS/Linux, check file permissions

## Next Steps

- [Configuration Guide](./configuration.md)
- [First Steps](./first-steps.md)

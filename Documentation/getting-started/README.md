# Getting Started with VoyageSmart

This section provides everything you need to get started with VoyageSmart, from installation to your first steps using the application.

## 📋 Contents

- [Installation](./installation.md) - How to install and set up VoyageSmart
- [Configuration](./configuration.md) - How to configure VoyageSmart with your API keys and preferences
- [First Steps](./first-steps.md) - Your first steps with VoyageSmart

## 🚀 Quick Start

If you're in a hurry, here's a quick guide to get VoyageSmart up and running:

### Prerequisites

Before you begin, make sure you have the following installed:

- Node.js (v16.0.0 or higher)
- npm (v7.0.0 or higher)
- Git

### Clone the Repository

```bash
git clone https://github.com/Wawen22/VoyageSmart.git
cd VoyageSmart
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

### Start the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application running.

## 📚 Next Steps

Once you have VoyageSmart up and running, check out the following resources:

- [Features Overview](../features/README.md) - Learn about all the features VoyageSmart offers
- [Architecture](../architecture/README.md) - Understand how VoyageSmart is built
- [Tutorials](../tutorials/README.md) - Step-by-step guides for common tasks

## 🤔 Need Help?

If you encounter any issues during installation or setup, check the following resources:

- [Troubleshooting Guide](./troubleshooting.md)
- [GitHub Issues](https://github.com/Wawen22/VoyageSmart/issues)
- [Community Forum](https://community.voyagesmart.com)

---

Next: [Installation](./installation.md)

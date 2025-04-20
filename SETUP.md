# VoyageSmart Setup Guide

This guide will help you set up the VoyageSmart project for development.

## Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)
- Git

## Installation Steps

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/voyage-smart.git
cd voyage-smart
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy the example environment file and update it with your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials and other API keys.

4. **Set up Supabase**

Follow the instructions in `supabase/setup-instructions.md` to set up your Supabase project.

5. **Start the development server**

```bash
npm run dev
```

The application will be available at http://localhost:3000.

## Project Structure

```
voyage-smart/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app router pages
│   ├── components/      # React components
│   ├── lib/             # Utility functions and libraries
│   ├── styles/          # Global styles
│   └── utils/           # Helper functions
├── supabase/            # Supabase configuration and schema
├── .env.local.example   # Example environment variables
├── .eslintrc.json       # ESLint configuration
├── .prettierrc          # Prettier configuration
├── next.config.js       # Next.js configuration
├── package.json         # Project dependencies
├── postcss.config.js    # PostCSS configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check for code issues

## Setting Up for Mobile Development (Future)

For the mobile app with React Native and Expo, we will set up a separate directory structure. This will be implemented in a future phase.

## Next Steps

1. Complete the authentication system
2. Implement the trip management features
3. Develop the itinerary timeline
4. Create the budget and expense tracking system
5. Build the collaboration features

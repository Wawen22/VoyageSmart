/**
 * Secure configuration management for VoyageSmart
 * This file centralizes all environment variables and provides type-safe access
 */

// Environment validation
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

// Optional environment variables for reference
// These are validated individually where needed

// Validate required environment variables
function validateEnvironment() {
  const missing: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Run validation on module load
if (typeof window === 'undefined') {
  validateEnvironment();
}

// Environment helpers
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const isTestEnv = process.env.NODE_ENV === 'test';

// Type-safe configuration object
export const config = {
  // Environment
  env: process.env.NODE_ENV as 'development' | 'production' | 'test',
  isDevelopment: isDev,
  isProduction: isProd,
  isTest: isTestEnv,

  // App configuration
  app: {
    name: 'VoyageSmart',
    version: process.env.npm_package_version || '1.0.0',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Supabase configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // AI configuration
  ai: {
    // Default provider selection
    defaultProvider: (process.env.NEXT_PUBLIC_AI_DEFAULT_PROVIDER as 'gemini' | 'openai' | 'deepseek' | 'gemini-openrouter') || 'gemini',

    // Gemini configuration
    gemini: {
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      model: 'gemini-2.0-flash-exp',
      maxTokens: 4096,
      temperature: 0.7,
    },

    // OpenAI configuration (Azure OpenAI)
    openai: {
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      model: 'gpt-5-nano',
      maxTokens: 4096,
      temperature: 1.0, // GPT-5-nano supports temperature = 1
      // Azure OpenAI specific configuration
      azure: {
        endpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT,
        apiVersion: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_VERSION || '2025-04-01-preview',
        deploymentName: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5-nano',
      },
    },

    // DeepSeek configuration (via OpenRouter)
    deepseek: {
      apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
      model: 'deepseek/deepseek-r1:free',
      maxTokens: 4096,
      temperature: 0.7,
    },

    // Gemini OpenRouter configuration
    'gemini-openrouter': {
      apiKey: process.env.NEXT_PUBLIC_OPENROUTER_GEMINI_API_KEY,
      model: 'google/gemini-2.0-flash-exp:free',
      maxTokens: 4096,
      temperature: 0.7,
    },

    // Legacy support (deprecated)
    geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    model: 'gemini-2.0-flash-exp',
    maxTokens: 4096,
    temperature: 0.7,
  },

  // Stripe configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    apiVersion: '2023-10-16' as const,
  },

  // Email configuration
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: 'noreply@voyagesmart.app',
    fromName: 'VoyageSmart',
  },

  // Maps configuration
  maps: {
    mapboxToken: process.env.MAPBOX_ACCESS_TOKEN,
  },

  // Security configuration
  security: {
    cronApiKey: process.env.CRON_API_KEY,
    jwtSecret: process.env.JWT_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY,
    
    // Rate limiting
    rateLimits: {
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
      },
      api: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
      },
      ai: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 20,
      },
    },

    // CORS configuration
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },

    // Content Security Policy - Secure configuration
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'strict-dynamic'",
        'https://js.stripe.com',
        'https://api.mapbox.com',
      ],
      styleSrc: [
        "'self'",
        'https://api.mapbox.com',
        'https://fonts.googleapis.com',
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'blob:',
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
      ],
      connectSrc: [
        "'self'",
        'https://api.stripe.com',
        'https://api.mapbox.com',
        'https://generativelanguage.googleapis.com',
        'https://*.supabase.co',
        'wss://*.supabase.co',
      ],
      frameSrc: [
        'https://js.stripe.com',
      ],
      workerSrc: [
        "'self'",
        'blob:',
      ],
    },
  },

  // Database configuration
  database: {
    connectionPoolSize: 10,
    queryTimeout: 30000, // 30 seconds
    maxRetries: 3,
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    enableConsole: true,
    enableFile: isProd,
    enableExternal: isProd,
    maxStoredErrors: 50,
  },

  // Feature flags
  features: {
    aiAssistant: true,
    aiWizard: true,
    referralProgram: true,
    promoCodeSystem: true,
    subscriptionPlans: true,
    emailNotifications: !!process.env.RESEND_API_KEY,
    mapIntegration: !!process.env.MAPBOX_ACCESS_TOKEN,
    stripePayments: !!process.env.STRIPE_SECRET_KEY,
  },

  // API endpoints
  api: {
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    timeout: 30000, // 30 seconds
    retries: 3,
  },

  // File upload configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxFiles: 10,
  },

  // Cache configuration
  cache: {
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100, // Maximum number of cached items
  },
} as const;

// Utility functions for configuration
export function getRequiredConfig<T>(value: T | undefined, name: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Required configuration value '${name}' is missing`);
  }
  return value;
}

export function getOptionalConfig<T>(value: T | undefined, defaultValue: T): T {
  return value !== undefined ? value : defaultValue;
}

// Environment-specific configurations
export function isDevelopment(): boolean {
  return config.env === 'development';
}

export function isProduction(): boolean {
  return config.env === 'production';
}

export function isTest(): boolean {
  return config.env === 'test';
}

// Feature flag helpers
export function isFeatureEnabled(feature: keyof typeof config.features): boolean {
  return config.features[feature];
}

// Security helpers
export function getSecureHeaders(): Record<string, string> {
  const csp = Object.entries(config.security.csp)
    .map(([directive, sources]) => `${directive.replace(/([A-Z])/g, '-$1').toLowerCase()} ${sources.join(' ')}`)
    .join('; ');

  return {
    'Content-Security-Policy': csp,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    ...(isProd && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    }),
  };
}

// Validation helpers
export function validateApiKey(key: string | undefined, name: string): string {
  if (!key) {
    throw new Error(`API key '${name}' is not configured`);
  }
  if (key.length < 10) {
    throw new Error(`API key '${name}' appears to be invalid (too short)`);
  }
  return key;
}

// Export specific configurations for easy access
export const supabaseConfig = config.supabase;
export const stripeConfig = config.stripe;
export const aiConfig = config.ai;
export const securityConfig = config.security;
export const loggingConfig = config.logging;

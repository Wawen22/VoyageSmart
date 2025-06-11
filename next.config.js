/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabilitato temporaneamente per risolvere problemi di idratazione
  images: {
    domains: ['ijtfwzxwthunsujobvsk.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ijtfwzxwthunsujobvsk.supabase.co',
      },
    ],
  },

  // Webpack configuration per risolvere problemi di moduli
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

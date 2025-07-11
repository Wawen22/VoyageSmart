/** @type {import('next').NextConfig} */
// Bundle analyzer - only load if needed
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config;

const nextConfig = {
  reactStrictMode: true, // Re-enabled for production

  // Disable ESLint and TypeScript checking during build for now
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Performance optimizations
  compress: true,

  // External packages that should not be bundled
  serverExternalPackages: ['mapbox-gl'],

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ijtfwzxwthunsujobvsk.supabase.co',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Fix for 'self is not defined' error - exclude problematic packages from server bundle
    if (isServer) {
      config.externals = config.externals || [];
      // Add all potentially problematic client-side libraries
      config.externals.push('mapbox-gl');
      config.externals.push('mapbox-gl/dist/mapbox-gl.css');
      config.externals.push('react-big-calendar');
      config.externals.push('framer-motion');
    }

    // Production optimizations - temporarily disabled to fix build issues
    // if (!dev) {
    //   config.optimization = {
    //     ...config.optimization,
    //     splitChunks: {
    //       chunks: 'all',
    //       cacheGroups: {
    //         vendor: {
    //           test: /[\\/]node_modules[\\/]/,
    //           name: 'vendors',
    //           chunks: 'all',
    //         },
    //       },
    //     },
    //   };
    // }

    return config;
  },

  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
};

module.exports = withBundleAnalyzer(nextConfig);

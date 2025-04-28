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
  // Server Actions are available by default in Next.js 14
  swcMinify: false, // Disabilita SWC per la minificazione
};

module.exports = nextConfig;

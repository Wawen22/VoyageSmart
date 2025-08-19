import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import '@/styles/map.css';
import '@/styles/modal-responsive.css';
import '@/styles/dashboard-mobile.css';
import { Providers } from '@/components/providers/Providers';
import Navbar from '@/components/layout/Navbar';
import MobileNavbar from '@/components/layout/MobileNavbar';
import OnboardingModal, { OnboardingModalProvider } from '@/components/subscription/OnboardingModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Voyage Smart - Travel Planning Made Easy',
  description: 'Plan your trips, manage expenses, and collaborate with friends all in one place.',
  icons: {
    icon: '/images/logo-voyage_smart.png',
    apple: '/images/logo-voyage_smart.png',
  },
  openGraph: {
    title: 'Voyage Smart - Travel Planning Made Easy',
    description: 'Plan your trips, manage expenses, and collaborate with friends all in one place.',
    images: ['/images/logo-voyage_smart.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voyage Smart - Travel Planning Made Easy',
    description: 'Plan your trips, manage expenses, and collaborate with friends all in one place.',
    images: ['/images/logo-voyage_smart.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} transition-theme antialiased`}>
        <ErrorBoundary>
          <Providers>
            <OnboardingModalProvider>
              <Navbar />
              <div className="pb-16 sm:pb-0"> {/* Add padding bottom on mobile for the navbar */}
                {children}
              </div>
              <MobileNavbar />
              <OnboardingModal />
            </OnboardingModalProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
